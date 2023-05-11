//CREATE TABLE todo(id INTEGER, todo TEXT, priority TEXT, status TEXT);
//Values (1, "Learn HTML", "HIGH", "TO DO"),
//(2, "Learn JS", "MEDIUM", "DONE"),
//(3, "Learn CSS", "LOW", "DONE");
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeServerDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error ${e.message}`);
    process.exit(1);
  }
};
initializeServerDb();

//
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

///

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

///
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
    * 
    FROM 
    todo 
    WHERE 
    id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
    INSERT INTO todo (id,todo,priority,status)
    VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    )`;
  const dbResponse = await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT 
    * 
    FROM 
    todo 
    WHERE 
    id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const updateQuery = `
  UPDATE 
  todo
  SET 
  todo='${todo}',
  priority='${priority}',
  status='${status}'
  WHERE id=${todoId};`;
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

//
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE
  FROM todo
  WHERE 
  id=${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
