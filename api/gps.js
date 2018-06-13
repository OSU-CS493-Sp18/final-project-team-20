const router = require('express').Router();
const validation = require('../lib/validation');

const { requireAuthentication } = require('../lib/auth');

const gpsSchema = {
  latitude: { required: true },
  longitude: { required: true },
  speed: { required: true },
  heading: { required: true }
};

function getGPSCount(mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT COUNT(*) AS count FROM gps', function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0].count);
      }
    });
  });
}

function getGPSPage(page, totalCount, mysqlPool) {
  return new Promise((resolve, reject) => {
    const numPerPage = 10;
    const lastPage = Math.max(Math.ceil(totalCount / numPerPage), 1);
    page = page < 1 ? 1 : page;
    page = page > lastPage ? lastPage : page;
    const offset = (page - 1) * numPerPage;

    mysqlPool.query(
      'SELECT * FROM gps ORDER BY id LIMIT ?,?',
      [ offset, numPerPage ],
      function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve({
            gps: results,
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
  getGPSCount(mysqlPool)
    .then((count) => {
      return getGPSPage(parseInt(req.query.page) || 1, count, mysqlPool);
    })
    .then((gpsPageInfo) => {
      gpsPageInfo.links = {};
      let { links, pageNumber, totalPages } = gpsPageInfo;
      if (pageNumber < totalPages) {
        links.nextPage = `/gps?page=${pageNumber + 1}`;
        links.lastPage = `/gps?page=${totalPages}`;
      }
      if (pageNumber > 1) {
        links.prevPage = `/gps?page=${pageNumber - 1}`;
        links.firstPage = '/gps?page=1';
      }
      res.status(200).json(gpsPageInfo);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: "Error fetching gps records. Please try again later."
      });
    });
});

function insertNewGPS(gps, mysqlPool) {
  return new Promise((resolve, reject) => {
    gps = validation.extractValidFields(gps, gpsSchema);
    gps.id = null;
    mysqlPool.query(
      'INSERT INTO gps SET ?',
      gps,
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
  if (validation.validateAgainstSchema(req.body, gpsSchema)) {
    insertNewGPS(req.body, mysqlPool)
      .then((id) => {
        res.status(201).json({
          id: id,
          links: {
            gps: `/gps/${id}`
          }
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: "Error inserting gps record into DB. Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid gps object."
    });
  }
});

function getGPSByID(gpsID, mysqlPool) {
  let returngps = {};
  return new Promise((resolve, reject) => {
    mysqlPool.query('SELECT * FROM gps WHERE id = ?', [ gpsID ], function (err, results) {
      if (err) {
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
}

router.get('/:gpsID', function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const gpsID = parseInt(req.params.gpsID);
  getGPSByID(gpsID, mysqlPool)
    .then((gps) => {
      if (gps) {
        res.status(200).json(gps);
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to fetch gps record. Please try again later."
      });
    });
});

function replaceGPSByID(gpsID, gps, mysqlPool) {
  return new Promise((resolve, reject) => {
    gps = validation.extractValidFields(gps, gpsSchema);
    mysqlPool.query('UPDATE gps SET ? WHERE id = ?', [ gps, gpsID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });
}

router.put('/:gpsID', requireAuthentication, function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const gpsID = parseInt(req.params.gpsID);
  if (validation.validateAgainstSchema(req.body, gpsSchema)) {
    replaceGPSByID(gpsID, req.body, mysqlPool)
      .then((updateSuccessful) => {
        if (updateSuccessful) {
          res.status(200).json({
            links: {
              gps: `/gps/${gpsID}`
            }
          });
        } else {
          next();
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: "Unable to update specified gps record. Please try again later."
        });
      });
  } else {
    res.status(400).json({
      error: "Request body is not a valid gps record object"
    });
  }
});

function deleteGPSByID(gpsID, mysqlPool) {
  return new Promise((resolve, reject) => {
    mysqlPool.query('DELETE FROM gps WHERE id = ?', [ gpsID ], function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.affectedRows > 0);
      }
    });
  });

}

router.delete('/:gpsID', requireAuthentication, function (req, res, next) {
  const mysqlPool = req.app.locals.mysqlPool;
  const gpsID = parseInt(req.params.gpsID);
  deleteGPSByID(gpsID, mysqlPool)
    .then((deleteSuccessful) => {
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Unable to delete gps record. Please try again later."
      });
    });
});

exports.router = router;
