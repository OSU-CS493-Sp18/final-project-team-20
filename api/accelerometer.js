const router = require('express').Router();
const validation = require('../lib/validation');

const { requireAuthentication } = require('../lib/auth');

const accelerometerSchema = {
  x: { required: true },
  y: { required: true },
  z: { required: true }
};

function getAccelerometerCount(mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT COUNT(*) AS count FROM accelerometer', function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0].count);
      }
    });
  });
}

function getAccelerometerPage(page, totalCount, mysqlPool) {
  return new Promise((resolve, reject) => {
    const numPerPage = 10;
    const lastPage = Math.max(Math.ceil(totalCount / numPerPage), 1);
    page = page < 1 ? 1 : page;
    page = page > lastPage ? lastPage : page;
    const offset = (page - 1) * numPerPage;

    mysqlPool.query(
      'SELECT * FROM accelerometer ORDER BY id LIMIT ?,?',
      [ offset, numPerPage ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve({
            accelerometer: results,
            pageNumber: page,
            totalPages: lastPage,
            pageSize: numPerPage,
            totalCount: totalCount
          });
        }
      }
    );
  });
}

router.get('/', function (req, res) {
  const mysqlPool = req.app.locals.mysqlPool;
  getAccelerometerCount(mysqlPool)
    .then((count) => {
      return getAccelerometerPage(parseInt(req.query.page) || 1, count, mysqlPool);
    })
    .then((accelerometerPageInfo) => {
      accelerometerPageInfo.links = {};
      let { links, pageNumber, totalPages } = accelerometerPageInfo;
      if (pageNumber < totalPages) {
        links.nextPage = `/accelerometer?page=${pageNumber + 1}`;
        links.lastPage = `/accelerometer?page=${totalPages}`;
      }
      if (pageNumber > 1) {
        links.prevPage = `/accelerometer?page=${pageNumber - 1}`;
        links.firstPage = '/accelerometer?page=1';
      }
      res.status(200).json(accelerometerPageInfo);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: "Error fetching accelerometer records. Please try again later."
      });
    });
});

function insertNewAccelerometer(accelerometer, mysqlPool) {
  return new Promise((resolve, reject) => {
    accelerometer = validation.extractValidFields(accelerometer, accelerometerSchema);
    accelerometer.id = null;
    mysqlPool.query(
      'INSERT INTO accelerometer SET ?',
      accelerometer,
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result.insertId);
        }
      }
    );
  });
}

router.post('/', requireAuthentication, function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  if (validation.validateAgainstSchema(req.body, accelerometerSchema)) {
    insertNewAccelerometer(req.body, mysqlPool)
      .then((id) => {
        res.status(201).json({
          id: id,
          links: {
            accelerometer: `/accelerometer/${id}`
          }
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: "Error inserting accelerometer record into DB. Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid accelerometer object."
    });
  }
});

function getAccelerometerByID(accelerometerID, mysqlPool) {
  let returnAccelerometer = {};
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT * FROM accelerometer WHERE id = ?', [ accelerometerID ], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
}

router.get('/:accelerometerID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const accelerometerID = parseInt(req.params.accelerometerID);
  getAccelerometerByID(accelerometerID, mysqlPool)
    .then((accelerometer) => {
      if (accelerometer) {
        res.status(200).json(accelerometer);
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch accelerometer record. Please try again later."
      });
    });
});

function replaceAccelerometerByID(accelerometerID, accelerometer, mysqlPool) {
  return new Promise((resolve, reject) => {
    accelerometer = validation.extractValidFields(accelerometer, accelerometerSchema);
    mysqlPool.query('UPDATE accelerometer SET ? WHERE id = ?', [ accelerometer, accelerometerID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });
}

router.put('/:accelerometerID', requireAuthentication, function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const accelerometerID = parseInt(req.params.accelerometerID);
  if (validation.validateAgainstSchema(req.body, accelerometerSchema)) {
    replaceAccelerometerByID(accelerometerID, req.body, mysqlPool)
      .then((updateSuccessful) => {
        if (updateSuccessful) {
          res.status(200).json({
            links: {
              accelerometer: `/accelerometer/${accelerometerID}`
            }
          });
        } else {
          next();
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "Unable to update specified accelerometer record. Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid accelerometer record object"
    });
  }
});

function deleteAccelerometerByID(accelerometerID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('DELETE FROM accelerometer WHERE id = ?', [ accelerometerID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });

}

router.delete('/:accelerometerID', requireAuthentication, function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const accelerometerID = parseInt(req.params.accelerometerID);
  deleteAccelerometerByID(accelerometerID, mysqlPool)
    .then((deleteSuccessful) => {
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to delete accelerometer record. Please try again later."
      });
    });
});

exports.router = router;
