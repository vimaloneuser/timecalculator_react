import React, { useState, useEffect } from 'react'
import './Style.css'
import axios from 'axios';
import toastr from 'toastr';
import "./toastr.min.css";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";
import moment from 'moment';
import TimePicker from 'react-time-picker';
import io from "socket.io-client";
import Modal from 'react-modal';
const ENDPOINT = 'https://time-calculator-node.herokuapp.com/';

let socket;

function App() {
  const [count, setCount] = useState(0);
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState(localStorage.getItem("activeTab") ? localStorage.getItem("activeTab") : 'timeSheet');
  const [todo, setTodo] = useState({
    date: null,
    task: [],
    completed: []
  });

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit('join', "",
      () => { });
  }, []);

  useEffect(() => {
    socket.on('countUpdate', data => {
      setCount(data);
    });
  }, []);

  const [data, setData] = useState(null);
  const [salert, setalert] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [loader, setLoader] = useState(false);
  const [time, settime] = useState("00:00");
  const [backTime, setbackTime] = useState(null);
  const [estimatedTime, setestimatedTime] = useState(null);
  const calculateData = () => {
    let csvData = document.getElementById("fname").value;
    if (!csvData) {
      toastr.error("input can to be blank!");
      return;
    }

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

  useEffect(() => {
    const unloadCallback = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", unloadCallback);
    return () => window.removeEventListener("beforeunload", unloadCallback);
  }, []);

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
    if (!time) {
      toastr.error("input can to be blank!");
      return;
    }
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
              let totaltime = formatTime(timestrToSec(cTime + ":00") + timestrToSec(data.remainingWorkingTime + ":00"));
              totaltime = formatTime(timestrToSec(totaltime) + timestrToSec(result + ":00"));
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

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: "white",
      width: "50%"
    },
  };

  useEffect(() => {
    let date = moment(new Date(), 'MM-DD-YY').format('MM-DD-YY');
    let tasks = localStorage.getItem("tasks");
    if (!tasks) {
      let obj = {
        date: date,
        task: [],
        completed: []
      }
      localStorage.setItem('tasks', JSON.stringify(obj));
      setTodo(obj);
    }
    else {
      let _data = JSON.parse(tasks);
      if (_data?.date !== date) {
        let obj = {
          date: date,
          task: [],
          completed: []
        }
        localStorage.setItem('tasks', JSON.stringify(obj));
        setTodo(obj);
      }
      else {
        calculateImp(_data)
      }
    }
  }, [])

  const calculateImp = (taksss) => {
    let _todo = taksss.task;
    let tempArr = [];
    let doitNow = _todo.filter(item => item?.important === true && item?.argent === true);
    if (doitNow.length > 0) {
      doitNow.map(im => 
        tempArr.push({
          ...im,
          priorityLevel: 10
        })
      )
    }

    let delegate = _todo.filter(item => item?.important === false && item?.argent === true);
    if (delegate.length > 0) {
      delegate.map(im => 
        tempArr.push({
          ...im,
          priorityLevel: 6
        })
      )
    }

    let schdule = _todo.filter(item => item?.important === true && item?.argent === false);
    if (schdule.length > 0) {
      schdule.map(im => 
        tempArr.push({
          ...im,
          priorityLevel: 4
        })
      )
    }

    let drop = _todo.filter(item => item?.important === false && item?.argent === false);
    if (drop.length > 0) {
      drop.map(im => 
        tempArr.push({
          ...im,
          priorityLevel: 2
        })
      )
    }
    localStorage.setItem('tasks', JSON.stringify({
      date: taksss.date,
      task: tempArr,
      completed: taksss.completed
    }));
    setTodo({
      date: taksss.date,
      task: tempArr,
      completed: taksss.completed
    });
  }

  return (
    <div id="container">
      <Modal
        isOpen={salert}
        contentLabel="Example Modal"
        style={customStyles}
      >
        <img
          alt='image'
          style={{
            height: 30, width: 30,
            float: "right",
            cursor: "pointer"
          }}
          onClick={() => setalert(false)}
          src={require('./assets/close.png').default}
        />
        <div>
          <h2>
            Ar you sure want to delete ?
          </h2>
          <input type="submit" value="Delete" onClick={() => {
            let __taks = todo.task;
            __taks.splice(deleteId, 1);
            setTodo({
              date: todo.date,
              task: __taks,
              completed: todo.completed
            })
            localStorage.setItem("tasks", JSON.stringify({
              date: todo.date,
              task: __taks,
              completed: todo.completed
            }))
            // calculateImp({
            //   date: todo.date,
            //   task: __taks,
            //   completed: todo.completed
            // });
            setalert(false);
          }} />
        </div>
      </Modal>

      <Modal
        isOpen={modal}
        contentLabel="Example Modal"
        style={customStyles}
      >
        <img
          style={{
            height: 30, width: 30,
            float: "right",
            cursor: "pointer"
          }}
          onClick={() => setModal(false)}
          src={require('./assets/close.png').default}
        />
        <h2>add your task</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            let title = e.target.title.value,
              description = e.target.taskDesc.value,
              important = e.target.important.value === "yes",
              argent = e.target.argent.value === "yes";
            calculateImp({
              date: todo.date,
              task: [
                ...todo.task,
                {
                  title, description, important, argent
                }
              ],
              completed: todo.completed
            });
            setModal(false)
          }}
        >
          <label for="title">Title</label>
          <input type="text" id="title" name="title" placeholder="your task title.." required />
          <p />
          <label for="taskDesc">Task argent</label>
          <input type="text" id="taskDesc" name="taskDesc" placeholder="you task description.." />
          <p />
          <label for="important">Is this task important ?</label>
          <select id="important" name="important">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <p />
          <label for="argent">Is this task argent ?</label>
          <select id="argent" name="argent">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <input type="submit" value="Submit" />
        </form>
      </Modal>


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

      <section
        className='tabs'
      >
        <div
          className={tab === 'timeSheet' ? 'activeTab' : 'inActiveTab'}
          onClick={() => { setTab("timeSheet"); localStorage.setItem("activeTab", "timeSheet") }}
        >
          <span>Timesheet</span>
        </div>
        <div
          className={tab === 'task' ? 'activeTab' : 'inActiveTab'}
          onClick={() => { setTab("task"); localStorage.setItem("activeTab", "task") }}
        >
          <span>Task</span>
        </div>
      </section>
      {2 > 0 && <span className="count" >Active user : <b>{count}</b></span>}

      {
        tab === 'timeSheet' ?
          <>
            <div
              className='mainSec'
            >
              <h2>Enter your attendance list</h2>
              <textarea id="fname" name="firstname" placeholder="Paste your attendance list here...." />
              <input type="submit" onClick={calculateData} value="Calculate Time" />
            </div>

            {
              data &&
              <div>
                <h3>Office time Status :
                  <b style={{ color: data.isOfficeTimeCompleted ? "green" : "red", fontSize: 20 }}>{data.isOfficeTimeCompleted ? " Completed" : " In Progress"}
                  </b>
                </h3>
                <h3>Working time Status :
                  <b style={{ color: data.isWorkingTimeCompleted ? "green" : "red", fontSize: 20 }}>{data.isWorkingTimeCompleted ? " Completed" : " In Progress"}
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

                  <div class="column2">
                    <div className="card" style={{ minHeight: data.isWorkingTimeCompleted ? 280 : 420 }}>
                      {
                        data?.totalBreaktime &&
                        <h3>Total break time : <b style={{ color: "#8250DF", fontSize: 22 }}>{data.totalBreaktime}</b></h3>
                      }
                      {
                        data?.remainingBreakTime &&
                        <h3>Remaining break time : <b style={{ color: "#8250DF", fontSize: 20 }}>{data.remainingBreakTime}</b></h3>
                      }
                      {
                        data?.completionTimeIfTakeBreak &&
                        <h3>Your time will be completed with remaining break at : <b style={{ color: "#8250DF", fontSize: 22 }}>{data.completionTimeIfTakeBreak}</b></h3>
                      }
                      <br />
                      {
                        !data.isWorkingTimeCompleted &&
                        <>
                          <div className="timeContainer">
                            <h3>Break time Pre-calculation</h3>
                            <TimePicker
                              onChange={settime}
                              format="HH:mm"
                              value={time}
                              disableClock
                            />
                            {/* <input id="appt-time" onChange={e => timeChange(e)} type="time" name="appt-time"></input> */}
                            <div>
                              <button style={{ marginRight: 10 }} className="btn" onClick={() => checkEstimation(true)}>Clock time based</button>
                              <button style={{ marginLeft: 10 }} className="btn" onClick={() => checkEstimation(false)}>Hourly based</button>
                            </div>
                          </div>
                          {
                            estimatedTime &&
                            <h3>Your working time will be completed at : <b style={{ color: "#D76100", fontSize: 22 }}>{estimatedTime}</b></h3>
                          }
                          {
                            backTime &&
                            <h3>Your expected In-time will be : <b style={{ color: "#D76100", fontSize: 22 }}>{backTime}</b></h3>
                          }
                        </>
                      }
                    </div>
                  </div>
                </div>

              </div>
            }
          </> : <>
            <div
              className='mainSec'
            >
              <span
                className='manageTask'
              >
                <h2>Manage your task</h2>
                <div
                  className='addTodoButton'
                  onClick={() => {
                    setModal(true);
                  }}
                >
                  <img
                    alt='image'
                    style={{
                      height: 30, width: 30
                    }}
                    src={require('./assets/add.png').default}
                  />
                  <span> add task</span>
                </div>
              </span>

              <section>
                <div class="row">
                  <div class="column2">
                    <div className="card" >
                      <h3 className='pending' >Pending task list</h3>

                      {
                        todo.task.map((item, index) =>
                          <div className='taskBody' >
                            <div>
                              <span>{index + 1 + ". " + item.title}</span>
                              {
                                item?.description !== '' && item?.description !== null &&
                                <p>- {item.description}</p>
                              }

                            </div>
                            <div
                              className='rightBody'
                            >
                              {
                                item?.priorityLevel !== undefined &&
                                <>
                                  <span
                                    style={{
                                      color: item.priorityLevel < 4 ? "green" : item.priorityLevel <= 6 ? 'orange' : "red",
                                      fontSize: 13
                                    }}
                                  >
                                    priority level
                                  </span>
                                  <span style={{
                                    color: "white",
                                    fontSize: 11,
                                    borderRadius: 11,
                                    background: "green",
                                    width: 21,
                                    height: 21,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textAlign: "center"
                                  }}>{item.priorityLevel}</span>
                                </>
                              }

                              <img
                                alt='image'
                                src={require('./assets/delete.png').default}
                                style={{
                                  height: 15,
                                  width: 15,
                                  marginRight: 10,
                                  cursor: "pointer"
                                }}
                                onClick={() => {
                                  setalert(true);
                                  setDeleteId(index)
                                }}
                              />

                              <input className='checkBox' type="checkbox" id="comleted" name="comleted"
                                onChange={() => {
                                  let _tempComp = todo.completed;
                                  _tempComp.push({
                                    ...item
                                  });
                                  let _tempTask = todo.task;
                                  _tempTask.splice(index, 1);

                                  setTodo({
                                    date: todo.date,
                                    task: _tempTask,
                                    completed: _tempComp
                                  })
                                  localStorage.setItem("tasks", JSON.stringify({
                                    date: todo.date,
                                    task: _tempTask,
                                    completed: _tempComp
                                  }))

                                }}
                                checked={false}
                              />
                            </div>
                          </div>
                        )
                      }
                    </div>
                  </div>
                  <div class="column">
                    <div className="card" >
                      <h3 className='done' >Completed task list</h3>
                      {
                        todo.completed.map((item, index) =>
                          <div className='taskBody' >
                            <div>
                              <span>{index + 1 + ". " + item.title}</span>
                              {
                                item?.description !== '' && item?.description !== null &&
                                <p>- {item.description}</p>
                              }

                            </div>
                            <div
                              className='rightBody'
                            >
                              {
                                item?.priorityLevel !== undefined &&
                                <>
                                  <span
                                    style={{
                                      color: item.priorityLevel < 4 ? "green" : item.priorityLevel <= 6 ? 'orange' : "red",
                                      fontSize: 13
                                    }}
                                  >
                                    priority level
                                  </span>
                                  <span style={{
                                    color: "white",
                                    fontSize: 11,
                                    borderRadius: 11,
                                    background: "green",
                                    width: 21,
                                    height: 21,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textAlign: "center"
                                  }}>{item.priorityLevel}</span>
                                </>
                              }

                              <input className='checkBox' type="checkbox" id="comleted" name="comleted"
                                onChange={() => {
                                  let _tempComp = todo.completed;
                                  _tempComp.splice(index, 1);

                                  let _tempTask = todo.task;
                                  _tempTask.push({
                                    ...item
                                  });

                                  calculateImp({
                                    date: todo.date,
                                    task: _tempTask,
                                    completed: _tempComp
                                  })

                                }}
                                checked={true}
                              />
                            </div>
                          </div>
                        )
                      }
                    </div>
                  </div>
                </div>

              </section>
            </div>
          </>
      }


    </div>
  )
}

export default App
