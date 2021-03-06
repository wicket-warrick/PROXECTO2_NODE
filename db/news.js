const { generateError } = require("../helpers/generateError.js");
const { createAndEditNewSchema } = require("../validators/newValidator.js");
const { getConnection } = require("./db.js");

const createNew = async (authorId, title, description, entradilla, topic) => {
  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.query(
      "INSERT INTO news(user_id,title,description,entradilla,topic)VALUES(?,?,?,?,?);",
      [authorId, title, description, entradilla, topic]
    );
    return result.insertId;
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const editNew = async (id, title, description, entradilla, topic) => {
  let connection;

  try {
    connection = await getConnection();

    const [currentNew] = await connection.query(
      "SELECT * FROM news WHERE id = ?;",
      [id]
    );

    if (currentNew.length === 0) {
      throw generateError(`A noticia co ID: ${id} non existe.`, 404);
    }

    if (!title) {
      title = currentNew[0].title;
    }

    if (!description) {
      description = currentNew[0].description;
    }

    if (!entradilla) {
      entradilla = currentNew[0].entradilla;
    }

    if (!topic) {
      topic = currentNew[0].topic;
    }

    const newData = {
      title,
      description,
      entradilla,
      topic,
    };

    await createAndEditNewSchema.validateAsync(newData);

    await connection.query(
      "UPDATE news SET title = ?, description = ?, entradilla = ?, topic = ? WHERE id = ?;",
      [title, description, entradilla, topic, id]
    );
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const deleteNew = async (id) => {
  let connection;

  try {
    connection = await getConnection();

    const [selectedNew] = await connection.query(
      "SELECT id FROM news WHERE id = ?;",
      [id]
    );

    if (selectedNew.length === 0) {
      throw generateError(`A notica con ID: ${id} non existe.`, 404);
    }

    await connection.query("DELETE FROM news WHERE id = ?;", [id]);
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getNewById = async (id) => {
  let connection;

  try {
    connection = await getConnection();

    const [results] = await connection.query(
      "SELECT n.id,n.title,n.entradilla,n.topic, n.description,u.name,n.user_id,n.createdAt,i.id as image_id, i.url FROM news n LEFT JOIN users u ON n.user_id=u.id LEFT JOIN news_images i ON i.new_id=n.id WHERE n.id = ?;",
      [id]
    );

    return results[0];
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getAllNews = async (modifiedAt, topic) => {
  let connection;

  try {
    connection = await getConnection();

    let query =
      "SELECT n.id,n.title,n.entradilla,n.topic, n.description,u.name,n.user_id,n.createdAt,i.id as image_id, i.url FROM news n LEFT JOIN users u ON n.user_id=u.id LEFT JOIN news_images i ON i.new_id=n.id";
    let clause = "WHERE";
    const values = [];
    if (modifiedAt) {
      query = `${query} ${clause} DATE(modifiedAt) <= ?`;
      clause = "AND";
      values.push(modifiedAt);
    }

    if (topic) {
      query = `${query} ${clause} topic = ?`;
      clause = "AND";
      values.push(topic);
    }

    const [results] = await connection.query(query, values);

    return results;
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getLastNewsOrderByVotes = async (modifiedAt) => {
  let connection;

  try {
    connection = await getConnection();

    const [results] = await connection.query(
      "SELECT n.title,i.url,n.entradilla,n.id,n.description,u.name,n.topic,COUNT(nv.new_id) AS votes FROM news n LEFT JOIN news_votes nv ON n.id=nv.new_id LEFT JOIN users u ON n.user_id=u.id LEFT JOIN news_images i ON i.new_id=n.id WHERE DATE(modifiedAt) <= ? GROUP BY n.id,i.url ORDER BY COUNT(nv.new_id) DESC ;",
      [modifiedAt]
    );

    return results;
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const createNewPhoto = async (newId, url) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.query("INSERT INTO news_images(new_id,url)VALUES(?,?);", [
      newId,
      url,
    ]);
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const deletePhotoById = async (id) => {
  let connection;

  try {
    connection = await getConnection();

    await connection.query("DELETE FROM news_images WHERE id = ?;", [id]);
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getPhotosInNew = async (id) => {
  let connection;
  try {
    connection = await getConnection();

    const result = connection.query(
      "SELECT id, url FROM news_images WHERE new_id = ?",
      [id]
    );

    return result;
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getNewPhotoById = async (id) => {
  let connection;

  try {
    connection = await getConnection();

    const [results] = await connection.query(
      "SELECT id, url FROM news_images WHERE id = ?;",
      [id]
    );

    return results[0];
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const voteNew = async (userId, newId) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.query(
      "INSERT INTO news_votes(user_id,new_id)VALUES(?,?);",
      [userId, newId]
    );
  } catch (error) {
    if (error.errno === 1062) {
      throw generateError(
        "Ya has votado esta noticia.Solo se puede votar una vez cada noticia.",
        400
      );
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  createNew,
  deleteNew,
  getNewById,
  editNew,
  getAllNews,
  createNewPhoto,
  getNewPhotoById,
  getPhotosInNew,
  deletePhotoById,
  voteNew,
  getLastNewsOrderByVotes,
};
