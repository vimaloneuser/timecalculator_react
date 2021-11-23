import React, { useState } from 'react'
import './Style.css'
import axios from 'axios';
import toastr from 'toastr';
import "./toastr.min.css";

function App() {
  const [data, setData] = useState(null);
  const calculateData = () => {
    let csvData = document.getElementById("fname").value;
    axios.post("https://time-calculator-node.herokuapp.com/csv", { csvData }).then(res => {
      console.log(res)
      setData(res.data.result);
      toastr.success('Your time is caluculated')
    }).catch(err => {
      toastr.error(err.response.data.error)
    })
  }

  console.log(data)

  return (
    <div id="container">
      <div>
        <h2>Enter your attendance list</h2>
        <textarea id="fname" name="firstname" placeholder="Paste your attendance list here...." />
        <input type="submit" onClick={calculateData} value="Calculate Time" />
      </div>
      {
        data &&
        <div>
          <h3>Office time is completed ? :
            <b style={{ color: data.isOfficeTimeCompleted ? "green" : "red" }}>{data.isOfficeTimeCompleted ? " Yes" : " No"}
            </b>
          </h3>
          <h3>Working time is completed ? :
            <b style={{ color: data.isWorkingTimeCompleted ? "green" : "red" }}>{data.isWorkingTimeCompleted ? " Yes" : " No"}
            </b></h3>
            <div className="section">
              <h3>Completed working time :
                <b style={{ color: "#276DC6", fontSize: 25 }}> {data.completedWorkingTime}</b></h3>
              <h3>Remaining working time : <b> {data.remainingWorkingTime}</b></h3>
              <h3>Completed office time : <b style={{ color: "#276DC6", fontSize: 25 }}>{data.comletedOfficeTime}</b></h3>
              <h3>Remaining office time : <b>{data.remainingOfficeTime}</b></h3>
            </div>
          </div>
      }
    </div>
  )
}

export default App
