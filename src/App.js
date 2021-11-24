import React, { useState } from 'react'
import './Style.css'
import axios from 'axios';
import toastr from 'toastr';
import "./toastr.min.css";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";
import moment from 'moment';

function App() {
  const [data, setData] = useState(null);
  const [loader, setLoader] = useState(false);
  const [time, settime] = useState("00:00");
  const [backTime, setbackTime] = useState(null);
  const [estimatedTime, setestimatedTime] = useState(null);
  const calculateData = () => {
    let csvData = document.getElementById("fname").value;
    setLoader(true);
    axios.post("https://time-calculator-node.herokuapp.com/csv", { csvData }).then(res => {
      setLoader(false);
      if (!res.data?.result)
        toastr.error("Something went wrong! Try again")
      else {
        toastr.success('Your time is caluculated')
        setData(res.data.result);
      }
    }).catch(err => {
      setLoader(false);
      toastr.error(err.response.data.error)
    })
  }

  const timeChange = (e) => {
    settime(e.target.value);
  }

  function timestrToSec(timestr) {
    var parts = timestr.split(":");
    return (parts[0] * 3600) +
      (parts[1] * 60) +
      (+parts[2]);
  }

  function pad(num) {
    if (num < 10) {
      return "0" + num;
    } else {
      return "" + num;
    }
  }

  function formatTime(seconds) {
    return [pad(Math.floor(seconds / 3600)),
    pad(Math.floor(seconds / 60) % 60),
    pad(seconds % 60),
    ].join(":");
  }

  function strToMins(t) {
    var s = t.split(":");
    return Number(s[0]) * 60 + Number(s[1]);
  }

  function minsToStr(t) {
    return Math.trunc(t / 60) + ':' + ('00' + t % 60).slice(-2);
  }


  const checkEstimation = (type) => {
    if (time !== "00:00") {
      var cTime = moment().format("HH:mm")
      if (type && (cTime + ":00" > time + ":00")) {
        toastr.error("Time is invalid")
        return;
      }
      else {
        let csvData = document.getElementById("fname").value;
        setLoader(true);
        axios.post("https://time-calculator-node.herokuapp.com/csv", { csvData }).then(res => {
          if (!res.data?.result) {
            setLoader(false);
            toastr.error("Something went wrong! Try again")
          }
          else {
            setData(res.data.result);
            setTimeout(() => {
              var result;
              if (type)
                result = minsToStr(strToMins(time) - strToMins(cTime));
              else
                result = time;
              console.log(result, "diff")
              let totaltime = formatTime(timestrToSec(cTime + ":00") + timestrToSec(data.remainingWorkingTime + ":00"));
              console.log(totaltime, "total 1")
              totaltime = formatTime(timestrToSec(totaltime) + timestrToSec(result + ":00"));
              console.log(totaltime, "total 2")
              var timeString = totaltime;
              var H = +timeString.substr(0, 2);
              var h = H % 12 || 12;
              var ampm = (H < 12 || H === 24) ? " AM" : " PM";
              timeString = h + timeString.substr(2, 3) + ampm;
              setestimatedTime(timeString);
              let _backTime;
              if (type)
                _backTime = time;
              else
                _backTime = formatTime(timestrToSec(cTime + ":00") + timestrToSec(time + ":00"));

              var _timeString = _backTime;
              var _H = +_timeString.substr(0, 2);
              var _h = _H % 12 || 12;
              var _ampm = (_H < 12 || _H === 24) ? " AM" : " PM";
              _timeString = _h + _timeString.substr(2, 3) + _ampm;
              setbackTime(_timeString);

              toastr.success('Your time is caluculated');
              setLoader(false);
            }, 1000);
          }
        }).catch(err => {
          setLoader(false);
          toastr.error(err.response.data.error)
        })
      }
    }
    else {
      toastr.error("Time is invalid")
      return;
    }
  }

  return (
    <div id="container">
      {
        loader && <div className="loader">
          <Loader
            type="Puff"
            color="#276DC6"
            height={130}
            width={130}
          />
        </div>
      }
      <div>
        <h2>Enter your attendance list</h2>
        <textarea id="fname" name="firstname" placeholder="Paste your attendance list here...." />
        <input type="submit" onClick={calculateData} value="Calculate Time" />
      </div>
      {
        data &&
        <div>
          <h3>Office time is completed ? :
            <b style={{ color: data.isOfficeTimeCompleted ? "green" : "red", fontSize: 20 }}>{data.isOfficeTimeCompleted ? " Yes" : " No"}
            </b>
          </h3>
          <h3>Working time is completed ? :
            <b style={{ color: data.isWorkingTimeCompleted ? "green" : "red", fontSize: 20 }}>{data.isWorkingTimeCompleted ? " Yes" : " No"}
            </b></h3>
          <div class="row">
            <div class="column">
              <div className="card" style={{ minHeight: data.isWorkingTimeCompleted ? 280 : 420 }}>
                <h3>Completed working time :
                  <b style={{ color: "#276DC6", fontSize: 25 }}> {data.completedWorkingTime}</b></h3>
                <h3>Remaining working time : <b style={{ color: "#00AED1" }}> {data.remainingWorkingTime}</b></h3>
                {
                  data?.yourTimeWillbeCompleted &&
                  <h3>Your time will be completed at : <b style={{ color: "#FFFFFF", fontSize: 20, backgroundColor: "#5EBA7D", borderRadius: 10, padding: 8 }}>{data.yourTimeWillbeCompleted}</b></h3>
                }
                <h3>Completed office time : <b style={{ color: "#276DC6", fontSize: 25 }}>{data.comletedOfficeTime}</b></h3>
                <h3>Remaining office time : <b style={{ color: "#00AED1" }}>{data.remainingOfficeTime}</b></h3>
              </div>
            </div>

            <div class="column">
              <div className="card" style={{ minHeight: data.isWorkingTimeCompleted ? 280 : 420 }}>
                {
                  data?.totalBreaktime &&
                  <h3>Total break time : <b style={{ color: "#8250DF", fontSize: 22 }}>{data.totalBreaktime}</b></h3>
                }
                {
                  data?.remainingBreakTime &&
                  <h3>Reamaining break time : <b style={{ color: "#8250DF", fontSize: 20 }}>{data.remainingBreakTime}</b></h3>
                }
                {
                  data?.completionTimeIfTakeBreak &&
                  <h3>Completion time if we take remaning break ? : <b style={{ color: "#8250DF", fontSize: 22 }}>{data.completionTimeIfTakeBreak}</b></h3>
                }
                <br />
                {
                  !data.isWorkingTimeCompleted &&
                  <>
                    <div className="timeContainer">
                      <h3>Break time Pre-calculation</h3>
                      <input id="appt-time" onChange={e => timeChange(e)} type="time" name="appt-time"></input>
                      <div>
                        <button style={{ marginRight: 10 }} className="btn" onClick={() => checkEstimation(true)}>Clock time based</button>
                        <button style={{ marginLeft: 10 }} className="btn" onClick={() => checkEstimation(false)}>Hour based</button>
                      </div>
                    </div>
                    {
                      estimatedTime &&
                      <h3>Your working time will be completed at : <b style={{ color: "#D76100", fontSize: 22 }}>{estimatedTime}</b></h3>
                    }
                    {
                      backTime &&
                      <h3>Your expected in time will be : <b style={{ color: "#D76100", fontSize: 22 }}>{backTime}</b></h3>
                    }
                  </>
                }
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  )
}

export default App
