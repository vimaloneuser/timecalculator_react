import React, { useState } from 'react'
import './Style.css'
import axios from 'axios';
import toastr from 'toastr';
import "./toastr.min.css";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";

function App() {
  const [data, setData] = useState(null);
  const [loader, setLoader] = useState(false);
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

  console.log(data)

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
              <div className="card">
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
              <div className="card">
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
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  )
}

export default App
