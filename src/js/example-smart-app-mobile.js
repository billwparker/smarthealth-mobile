(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }


    function titleCase(str) {
      return str.toLowerCase().split(' ').map(function(word) {
        return word.replace(word[0], word[0].toUpperCase());
      }).join(' ');
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {

        document.getElementById('main-wait').style.display = "block"  

        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4', 'http://loinc.org|3141-9',
                              'http://loinc.org|8867-4', 'http://loinc.org|8310-5', 'http://loinc.org|2160-0',
                              'http://loinc.org|718-7', 'http://loinc.org|2345-7', 'http://loinc.org|2823-3',
                              'http://loinc.org|2951-2'
                            ]
                      }
                    }
                  });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';
          var fullname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
            fullname = fname + ' ' + lname;
          }

          var height = byCodes('8302-2');
          var weight = byCodes('3141-9')
          var heartrate = byCodes('8867-4');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          var temperature = byCodes('8310-5');
          var creatinine = byCodes('2160-0');
          var hemoglobin = byCodes('718-7');
          var glucose = byCodes('2345-7');
          var potassium = byCodes('2823-3');
          var sodium = byCodes('2951-2');

          console.log(heartrate);

          console.log(temperature)

          console.log(hemoglobin);
          console.log(glucose)

          var weight = byCodes('3141-9');

          console.log(weight)

          var weights = getWeights(weight)

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = titleCase(gender);
          p.fname = titleCase(fname);
          p.lname = titleCase(lname);
          p.fullname = titleCase(fullname);
          p.height = getQuantityValueAndUnit(height[0]);
          p.temperature = getQuantityValueAndUnit(temperature[0]);
          p.weight = getQuantityValueAndUnit(weight[0]);
          p.heartrate = getQuantityValueAndUnit(heartrate[0]);
          p.creatinine = getQuantityValueAndUnit(creatinine[0]);
          p.hemoglobin = getQuantityValueAndUnit(hemoglobin[0]);
          p.glucose = getQuantityValueAndUnit(glucose[0]);
          p.potassium = getQuantityValueAndUnit(potassium[0]);
          p.sodium = getQuantityValueAndUnit(sodium[0]);

          console.log(p.fullname);

          console.log(sodium);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          console.log(ldl)

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          // document.getElementById('greeting').style.display = "block"  
          document.getElementById('demo-table').style.display = "block"  
          document.getElementById('main-wait').style.display = "none"  

          // PLOTLY
          var data = [
            {
              // x: ['2013-10-04 22:23:00', '2013-11-04 22:23:00', '2013-12-04 22:23:00'],
              // y: [1, 3, 6],
              x: weights[0],
              y: weights[1],
              type: 'scatter'
            }
          ];

          var layout = {
            title: 'Weight',
            // xaxis: {
            //   fixedrange: fixed,
            //   tickformat: 'd'
            // },
            // yaxis: {
            //   fixedrange: fixed,
            //   range: y1
            // },
            paper_bgcolor: "whitesmoke",
          }    
        
          
          // Plotly.newPlot('weight-chart', data, layout, {displayModeBar: false});
          //--------------------------------------

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      fullname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      weight: {value: ''},
      heartrate: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      temperature: {value: ''},
      creatinine: {value: ''},
      hemoglobin: {value: ''},
      glucose: {value: ''},
      sodium: {value: ''},
      potassium: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {

      return "-";
      //return undefined;
    }
  }

  function getWeights(wgts) {

    console.log(wgts);

    var w = wgts.map(item => {

      if ('effectiveDateTime' in item)
        v = item['effectiveDateTime']  

      return v;
    });    
  
    var z = wgts.map(item => {

      if ('valueQuantity' in item)
        v = item['valueQuantity']['value']
      return v;
    });  

    r = [];
    r.push(w);
    r.push(z);

    console.log(r);

    return r;
  }


  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#fullname').html(p.fullname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#weight').html(p.weight);
    $('#heartrate').html(p.heartrate);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#temperature').html(p.temperature);
    $('#creatinine').html(p.creatinine);
    $('#hemoglobin').html(p.hemoglobin);
    $('#glucose').html(p.glucose);
    $('#sodium').html(p.sodium);
    $('#potassium').html(p.potassium);
  };

})(window);
