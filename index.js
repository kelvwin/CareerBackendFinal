const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8000;
const redis = require("redis");
const { uuid } = require("uuidv4");
require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const client = redis.createClient({
  password: process.env.PASSWORD,
  socket: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
});
client.on("error", (err) => console.log("Redis Client Error", err));

const addToDatabase = async (key, value) => {
  console.log("addToDatabase:", key, value, typeof value);
  await client.hSet(key, value);
  const valueFromDb = await client.hGetAll(key);
  console.log(`${JSON.stringify(valueFromDb)} added to database (object)`);
};

const deleteFromDatabase = async (key) => {
  await client.del(key);
  console.log(`${key} is deleted from database`);
};

const getFromDatabase = async (key) => {
  const result = await client.hGetAll(key);
  console.log(process.env.PASSWORD);
  console.log(JSON.stringify(result));
  return result;
};

// Define a route for the homepage
app.get("/", (req, res) => {
  res.send("Hello, Kawin!");
});

//List out lists
app.get("/lists", async (req, res) => {
  try {
    const searchPattern = "list:*"; // Example pattern: all keys starting with "l"
    const keys = await client.keys(searchPattern, (err, keys) => {
      if (err) {
        console.error(err);
      } else {
        console.log("Matching Keys:", keys);
      }
    });
    const listArray = [];
    await Promise.all(
      keys.map(async (key) => {
        const list = await getFromDatabase(key);
        listArray.push(list);
      })
    );
    console.log("LIST ARRAY", listArray);
    res.status(200).json({ lists: listArray });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

//List out tasks
app.get("/lists/:listId/tasks", async (req, res) => {
  const listId = req.params.listId;
  const list = await getFromDatabase(listId);
  if (Object.keys(list).length === 0) {
    res.status(404).json({ message: "Not found" });
  } else {
    const taskArray = [];
    await Promise.all(
      list.tasks.split(",").map(async (key) => {
        const task = await getFromDatabase(key);
        taskArray.push(task);
      })
    );
    console.log("TASK ARRAY", taskArray);
    res.status(200).json({ tasks: taskArray });
  }
});

// Create a list
app.post("/lists", async (req, res) => {
  //example task
  /*const listModel = {
    listId: "list:qwjej1231823128j",
    title: "to-do",
    order: "1",
  };*/
  console.log(req.body);
  const bodyList = { ...req.body.list, listId: "list:" + uuid() };
  const list = await getFromDatabase(bodyList.listId);
  if (Object.keys(list).length === 0) {
    try {
      await addToDatabase(bodyList.listId, { ...bodyList, tasks: "" });
      res.status(201).json(bodyList);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: e.message });
    }
  } else {
    res.status(409).json({ message: "List already exists" });
  }
});

//Create a task
app.post("/lists/:listId", async (req, res) => {
  const listId = req.params.listId;
  const list = await getFromDatabase(listId);
  if (Object.keys(list).length === 0) {
    res.status(404).json({ message: "Not found" });
  } else {
    const bodyTask = { ...req.body.task, taskId: "task:" + uuid() };
    //example task
    /*const task = {
      taskId: "1",
      title: "finish homework",
      description: "champ career track backend code",
      dueDate: "2023-05-26T09:46:12.182Z",
      order: "1",
    };*/
    if (!list.tasks.includes(bodyTask.taskId)) {
      const updatedList = {
        ...list,
        tasks: list.tasks.concat(
          list.tasks.length !== 0 ? "," + bodyTask.taskId : bodyTask.taskId
        ),
      };
      try {
        await addToDatabase(bodyTask.taskId, bodyTask);
        await addToDatabase(list.listId, updatedList);
        res.status(201).json(bodyTask);
      } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
      }
    } else {
      res.status(409).json({ message: "Task already exist" });
    }
  }
});

//Delete a Task
app.delete("/lists/:listId/tasks/:taskId", async (req, res) => {
  const listId = req.params.listId;
  const taskId = req.params.taskId;
  const list = await getFromDatabase(listId);
  console.log(list);
  if (Object.keys(list).length === 0 || !list.tasks.includes(taskId)) {
    res.status(404).json({ message: "Not found" });
  } else {
    const currentTasks = list.tasks.split(",");
    const newTasks = currentTasks
      .filter((task_id) => task_id !== taskId)
      .join(",");
    console.log("newTasks", newTasks);
    const updatedList = {
      ...list,
      tasks: newTasks,
    };
    try {
      await deleteFromDatabase(taskId);
      await addToDatabase(list.listId, updatedList);
      res.sendStatus(200);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: e.message });
    }
  }
});

//Delete a list and tasks in the list
app.delete("/lists/:listId", async (req, res) => {
  const listId = req.params.listId;
  const list = await getFromDatabase(listId);
  console.log(list);
  if (Object.keys(list).length === 0) {
    res.status(404).json({ message: "Not found" });
  } else {
    const currentTasks = list.tasks.split(",");
    try {
      //DELETE LIST
      await deleteFromDatabase(listId);
      //CASCADE DELETE TASKS
      currentTasks.forEach(async (task_id) => {
        await deleteFromDatabase(task_id);
      });
      res.sendStatus(200);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: e.message });
    }
  }
});

//Update a list (reorder a list as well, reorder a task in a list)
app.put("/lists/:listId", async (req, res) => {
  const listId = req.params.listId;
  const list = await getFromDatabase(listId);
  if (Object.keys(list).length === 0) {
    res.status(404).json({ message: "Not found" });
  } else {
    const bodyList = req.body.list;
    const newList = { ...list };
    Object.keys(bodyList).forEach((key) => {
      if (key !== "listId") newList[key] = bodyList[key];
    });
    try {
      await addToDatabase(listId, newList);
      const updatedList = await getFromDatabase(listId);
      res.status(200).json(updatedList);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: e.message });
    }
  }
});

//Update a task
app.put("/lists/:listId/tasks/:taskId", async (req, res) => {
  const listId = req.params.listId;
  const taskId = req.params.taskId;
  const moveTo = req.query.moveTo;
  const list = await getFromDatabase(listId);
  if (Object.keys(list).length === 0 || !list.tasks.includes(taskId)) {
    res.status(404).json({ message: "Not found" });
  } else if (moveTo) {
    // Move a task to another list
    const destinationList = await getFromDatabase(moveTo);
    if (destinationList.tasks.includes(taskId)) {
      res.status(409).json({ message: "Cannot move to the same list" });
    }
    const newCurrentList = {
      ...list,
      tasks: list.tasks
        .split(",")
        .filter((task_id) => task_id !== taskId)
        .join(","),
    };
    console.log("TASK ID", taskId);
    const test = destinationList.tasks.concat(
      destinationList.tasks.length !== 0 ? "," + taskId : taskId
    );
    console.log("CONCAT", test);
    const newDestinationList = {
      ...destinationList,
      tasks: test,
    };
    console.log("NEW DESTINATION LIST", newDestinationList);
    try {
      await addToDatabase(listId, newCurrentList);
      await addToDatabase(moveTo, newDestinationList);
      const updatedList = await getFromDatabase(moveTo);
      console.log("updatedList", updatedList);
      res.status(200).json(updatedList);
    } catch (e) {
      console.log(e);
    }
  } else {
    const task = await getFromDatabase(taskId);
    const bodyTask = req.body.task;
    const newTask = { ...task };
    Object.keys(bodyTask).forEach((key) => {
      if (key !== "taskId") newTask[key] = bodyTask[key];
    });
    try {
      await addToDatabase(taskId, newTask);
      const updatedTask = await getFromDatabase(taskId);
      res.status(200).json(updatedTask);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: e.message });
    }
  }
});

/////////////////////////////////////////////////////////////////////////////////////////

// Start the server
app.listen(port, async () => {
  await client.connect();
  console.log(`Server listening on port ${port}`);
});
