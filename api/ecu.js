const router = require('express').Router();
const validation = require('../lib/validation');

const { requireAuthentication } = require('../lib/auth');

const ecuSchema = {
  dwell: { required: true },
  map: { required: true },
  iat: { required: true },
  clt: { required: true },
  battery: { required: true },
  o2: { required: true },
  rpm: { required: true },
  advance: { required: true },
  tps: { required: true },
  loopsPerSecond: { required: true },
  freeRAM: { required: true }
};

function getECUCount(mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT COUNT(*) AS count FROM ecu', function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0].count);
      }
    });
  });
}

function getECUPage(page, totalCount, mysqlPool) {
  return new Promise((resolve, reject) => {
    const numPerPage = 10;
    const lastPage = Math.max(Math.ceil(totalCount / numPerPage), 1);
    page = page < 1 ? 1 : page;
    page = page > lastPage ? lastPage : page;
    const offset = (page - 1) * numPerPage;

    mysqlPool.query(
      'SELECT * FROM ecu ORDER BY id LIMIT ?,?',
      [ offset, numPerPage ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve({
            ecu: results,
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
  getECUCount(mysqlPool)
    .then((count) => {
      return getECUPage(parseInt(req.query.page) || 1, count, mysqlPool);
    })
    .then((ecuPageInfo) => {
      ecuPageInfo.links = {};
      let { links, pageNumber, totalPages } = ecuPageInfo;
      if (pageNumber < totalPages) {
        links.nextPage = `/ecu?page=${pageNumber + 1}`;
        links.lastPage = `/ecu?page=${totalPages}`;
      }
      if (pageNumber > 1) {
        links.prevPage = `/ecu?page=${pageNumber - 1}`;
        links.firstPage = '/ecu?page=1';
      }
      res.status(200).json(ecuPageInfo);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: "Error fetching ecu records. Please try again later."
      });
    });
});

function insertNewECU(ecu, mysqlPool) {
  return new Promise((resolve, reject) => {
    ecu = validation.extractValidFields(ecu, ecuSchema);
    ecu.id = null;
    mysqlPool.query(
      'INSERT INTO ecu SET ?',
      ecu,
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
  if (validation.validateAgainstSchema(req.body, ecuSchema)) {
    insertNewECU(req.body, mysqlPool)
      .then((id) => {
        res.status(201).json({
          id: id,
          links: {
            ecu: `/ecu/${id}`
          }
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: "Error inserting ecu record into DB. Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid ecu object."
    });
  }
});

function getECUByID(ecuID, mysqlPool) {
  let returnECU = {};
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT * FROM ecu WHERE id = ?', [ ecuID ], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
}

router.get('/:ecuID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const ecuID = parseInt(req.params.ecuID);
  getECUByID(ecuID, mysqlPool)
    .then((ecu) => {
      if (ecu) {
        res.status(200).json(ecu);
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch ecu record. Please try again later."
      });
    });
});

function replaceECUByID(ecuID, ecu, mysqlPool) {
  return new Promise((resolve, reject) => {
    ecu = validation.extractValidFields(ecu, ecuSchema);
    mysqlPool.query('UPDATE ecu SET ? WHERE id = ?', [ ecu, ecuID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });
}

router.put('/:ecuID', requireAuthentication, function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const ecuID = parseInt(req.params.ecuID);
  if (validation.validateAgainstSchema(req.body, ecuSchema)) {
    replaceECUByID(ecuID, req.body, mysqlPool)
      .then((updateSuccessful) => {
        if (updateSuccessful) {
          res.status(200).json({
            links: {
              ecu: `/ecu/${ecuID}`
            }
          });
        } else {
          next();
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "Unable to update specified ecu record. Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid ecu record object"
    });
  }
});

function deleteECUByID(ecuID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('DELETE FROM ecu WHERE id = ?', [ ecuID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });

}

router.delete('/:ecuID', requireAuthentication, function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const ecuID = parseInt(req.params.ecuID);
  deleteECUByID(ecuID, mysqlPool)
    .then((deleteSuccessful) => {
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to delete ecu record. Please try again later."
      });
    });
});

exports.router = router;
