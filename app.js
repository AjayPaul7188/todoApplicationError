const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const checkInvalidScenariosForPost = (request, response, next) => {
  const { status, priority, category, search_q, dueDate } = request.body;

  const validStatusList = ["TO DO", "IN PROGRESS", "DONE"];
  const validPriorityList = ["HIGH", "MEDIUM", "LOW"];
  const validCategoryList = ["WORK", "HOME", "LEARNING"];

  if (status !== undefined && validStatusList.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
    invalidError = true;
  } else if (
    priority !== undefined &&
    validPriorityList.includes(priority) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
    invalidError = true;
  } else if (
    category !== undefined &&
    validCategoryList.includes(category) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
    invalidError = true;
  } else if (dueDate !== undefined && isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

const checkInvalidScenarios = (request, response, next) => {
  const { status, priority, category, search_q, date } = request.query;

  const validStatusList = ["TO DO", "IN PROGRESS", "DONE"];
  const validPriorityList = ["HIGH", "MEDIUM", "LOW"];
  const validCategoryList = ["WORK", "HOME", "LEARNING"];

  if (status !== undefined && validStatusList.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
    invalidError = true;
  } else if (
    priority !== undefined &&
    validPriorityList.includes(priority) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
    invalidError = true;
  } else if (
    category !== undefined &&
    validCategoryList.includes(category) === false
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
    invalidError = true;
  } else if (date !== undefined && isValid(new Date(date)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

//API1
app.get("/todos/", checkInvalidScenarios, async (request, response) => {
  const { status, priority, category, search_q } = request.query;
  let data = null;
  let getTodoQuery = "";
  let invalidError = false;

  const validStatusList = ["TO DO", "IN PROGRESS", "DONE"];
  const validPriorityList = ["HIGH", "MEDIUM", "LOW"];
  const validCategoryList = ["WORK", "HOME", "LEARNING"];

  const priorityAndStatus =
    validPriorityList.includes(priority) && validStatusList.includes(status);

  switch (true) {
    case validStatusList.includes(status):
      getTodoQuery = `select * from todo where status = '${status}';`;
      break;

    case validPriorityList.includes(priority):
      getTodoQuery = `select * from todo where priority = '${priority}';`;
      break;

    case priorityAndStatus:
      getTodoQuery = `select * from todo where priority = '${priority}' and status = '${status}';`;
      break;

    case search_q !== undefined:
      getTodoQuery = `select * from todo where todo like '%${search_q}%';`;
      break;

    case validCategoryList.includes(category) &&
      validStatusList.includes(status):
      getTodoQuery = `select * from todo where category = '${category}' and status = '${status}';`;
      break;

    case validCategoryList.includes(category):
      getTodoQuery = `select * from todo where category = '${category}';`;
      break;

    case validCategoryList.includes(category) &&
      validPriorityList.includes(priority):
      getTodoQuery = `select * from todo where category = '${category}' and priority = '${priority}';`;
      break;

    default:
      break;
  }

  data = await db.all(getTodoQuery);
  response.send(
    data.map((eachOne) => convertDBObjectToResponseObject(eachOne))
  );
});

//API2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `select * from todo where
    id = '${todoId}';`;

  const data = await db.get(getTodoQuery);
  response.send(convertDBObjectToResponseObject(data));
});

//API3
app.get("/agenda/", checkInvalidScenarios, async (request, response) => {
  const { date } = request.query;

  const formattedDate = format(new Date(date), "yyyy-MM-dd");
  const getTodoQuery = `select * from todo where
    due_date = '${formattedDate}';`;

  data = await db.all(getTodoQuery);
  response.send(
    data.map((eachOne) => convertDBObjectToResponseObject(eachOne))
  );
});

//API4
app.post("/todos/", checkInvalidScenariosForPost, async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  const postTodoDetailsQuery = `
    insert into
    todo(id, todo, priority, status, category, due_date)
    values(
        '${id}',
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
    );`;

  const dbResponse = await db.run(postTodoDetailsQuery);
  response.send("Todo Successfully Added");
});

//API5
app.put(
  "/todos/:todoId/",
  checkInvalidScenariosForPost,
  async (request, response) => {
    const { todoId } = request.params;

    const { todo, status, priority, category, dueDate } = request.body;

    let data = null;

    let updateTodoQuery = "";

    switch (true) {
      case status !== undefined:
        updateTodoQuery = `update todo set status='${status}';`;

        data = await db.run(updateTodoQuery);
        response.send("Status Updated");
        break;

      case priority !== undefined:
        updateTodoQuery = `update todo set priority='${priority}';`;

        data = await db.run(updateTodoQuery);
        response.send("Priority Updated");
        break;

      case todo !== undefined:
        updateTodoQuery = `update todo set todo='${todo}';`;

        data = await db.run(updateTodoQuery);
        response.send("Todo Updated");
        break;

      case category !== undefined:
        updateTodoQuery = `update todo set category='${category}';`;

        data = await db.run(updateTodoQuery);
        response.send("Category Updated");
        break;

      case dueDate !== undefined:
        const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `update todo set due_date='${formattedDate}';`;

        data = await db.run(updateTodoQuery);
        response.send("Due Date Updated");
        break;

      default:
        break;
    }
  }
);

//API6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `delete from todo where id='${todoId}';`;

  db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
