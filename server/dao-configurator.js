"use strict";

const db = require('./db');

const convertFromDBRecord = (dbRecord) => {
    return Object.assign({}, dbRecord);
};

// unauthN also as soon as they land on the page
exports.listModels = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM cars';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            const models = rows.map(convertFromDBRecord);
            resolve(models);
        });
    });
};

// unauthN also as soon as they land on the page
exports.listAccessories = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM accessories';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            const accessories = rows.map(convertFromDBRecord);
            resolve(accessories);
        });
    });
};
// only authN as soon as they login -> input: userId
exports.getConfigurationById = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT config.*, GROUP_CONCAT(sel_acc.accessoryId, ',') as accessoryIds FROM car_configurations config
                    LEFT JOIN selected_accessories sel_acc ON config.userId = sel_acc.userId WHERE config.userId = ? GROUP BY config.userId`;
        db.get(sql, [userId], (err, row) => {
            if (err) {
                reject(err);
            }
            if (row) {
                const configuration = convertFromDBRecord(row);
                configuration.accessoryIds = row.accessoryIds ? row.accessoryIds.split(',').map(Number) : [];
                resolve(configuration);
            } else {
                resolve(null); // config not found for user -> NULL
            }
        });
    });
};

// might be needed later. incompatibility? check dependency 2nd one present in order to add 1st one; if 2nd present then incompatible.
function getAccessoryConstraints() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM accessory_constraints';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            const accConstraints = rows.map(convertFromDBRecord);
            resolve(accConstraints);
        });
    });
}

// authN get accessories + constraints to show on client-side (more data here)
exports.listAccessoriesWithConstraints = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT acc.*,
                req.id AS requiredAccessoryId,
                req.name AS requiredAccessoryName,
                inc.id AS incompatibleAccessoryId,
                inc.name AS incompatibleAccessoryName
            FROM accessories acc
            LEFT JOIN accessory_constraints req_con ON acc.id = req_con.accessoryId AND req_con.requiredAccessoryId IS NOT NULL
            LEFT JOIN accessories req ON req.id = req_con.requiredAccessoryId
            LEFT JOIN accessory_constraints inc_con ON acc.id = inc_con.accessoryId AND inc_con.incompatibleAccessoryId IS NOT NULL
            LEFT JOIN accessories inc ON inc.id = inc_con.incompatibleAccessoryId`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            const accessories = rows.map(row => ({
                id: row.id,
                name: row.name,
                priceEur: row.priceEur,
                availability: row.availability,
                requiredAccessoryId: row.requiredAccessoryId,
                requiredAccessoryName: row.requiredAccessoryName || null,
                incompatibleAccessoryId: row.incompatibleAccessoryId,
                incompatibleAccessoryName: row.incompatibleAccessoryName || null
            }));

            resolve(accessories);
        });
    });
};


// authN when saving/deleting/updating config -> update
function updateAvailability(id, action) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE accessories SET availability = availability + ? WHERE id = ? AND availability + ? >= 0';
        const value = action === 'add' ? 1 : -1;
        db.run(sql, [value, id, value], function (err) {
            if (err) {
                reject(err);
            } else if (this.changes === 0) {
                reject({ error: "Not sufficient availability or accessory wasn't found" });
            } else {
                resolve({ message: "Availability was successfully updated" });
            }
        });
    });
};


function updateAccessories(userId, accessories) {
    return new Promise((resolve, reject) => {
        const delete_sql = 'DELETE FROM selected_accessories WHERE userId = ? AND accessoryId NOT IN (?)';
        const accessory_ids = accessories || [];
        db.run(delete_sql, [userId, accessory_ids], function (err) {
            if (err) {
                reject(err);
            }
        const insert_sql = 'INSERT INTO selected_accessories (userId, accessoryId) VALUES (?, ?)';
            accessory_ids.forEach(accessory_id => {
                db.run(insert_sql, [userId, accessory_id], function (err) {
                    if (err) {
                        reject(err);
                    }
                });
            });
            resolve();
        });
    });
};

async function checkAccessories(model_id, accessories, constraints) {
    const sql = 'SELECT maxNumAccessories FROM cars WHERE id = ?';
    const max_accessories = await new Promise((resolve, reject) => {
        db.get(sql, [model_id], (err, row) => {
            if (err) {
                return reject(err);
            }
            if (!row) {
                return reject(new Error('Car model not found'));
            }
            resolve(row.maxNumAccessories);
        });
    });

    if (accessories.length > max_accessories) {
        throw new Error('Overflowed maximum number of accessories');
    }
    
    const accessoryCount = {};
    accessories.forEach(accessoryId => {
        if (accessoryCount[accessoryId]) {
            accessoryCount[accessoryId]++;
        } else {
            accessoryCount[accessoryId] = 1;
        }

        if (accessoryCount[accessoryId] > 1) {
            throw new Error(`Accessory ${accessoryId} is duplicated`);
        }
    });

    accessories.forEach(accessoryId => {
        const constraint = constraints.find(e => e.accessoryId === accessoryId);

        if (constraint) {
            if (constraint.requiredAccessoryId && !accessories.includes(constraint.requiredAccessoryId)) {
                throw new Error(`Accessory ${accessoryId} requires accessory ${constraint.requiredAccessoryId}`);
            }

            if (constraint.incompatibleAccessoryId && accessories.includes(constraint.incompatibleAccessoryId)) {
                throw new Error(`Accessory ${accessoryId} is incompatible with accessory ${constraint.incompatibleAccessoryId}`);
            }
        }
    });
}
exports.updateExistingConfiguration = async (car_configuration) => {
    try {
        const accessory_constraints = await getAccessoryConstraints();
        await checkAccessories(car_configuration.carModelId, car_configuration.accessories, accessory_constraints);

        const existingConfiguration = await new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM car_configurations WHERE userId = ?';
            db.get(sql, [car_configuration.userId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });

        if (!existingConfiguration) {
            return { error: 'No existing configuration found for the user' };
        }

        const existingAccessories = await new Promise((resolve, reject) => {
            const sql = 'SELECT accessoryId FROM selected_accessories WHERE userId = ?';
            db.all(sql, [car_configuration.userId], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows.map(row => row.accessoryId));
            });
        });

        const accessoriesToAdd = car_configuration.accessories.filter(id => !existingAccessories.includes(id));
        const accessoriesToRemove = existingAccessories.filter(id => !car_configuration.accessories.includes(id));

        const update_sql = 'UPDATE car_configurations SET carModelId = ? WHERE userId = ?';
        await new Promise((resolve, reject) => {
            db.run(update_sql, [car_configuration.carModelId, car_configuration.userId], (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });

        await updateAccessories(car_configuration.userId, car_configuration.accessories);
        for (const accessory of accessoriesToRemove) {
            await updateAvailability(accessory, 'add');
        }
        for (const accessory of accessoriesToAdd) {
            await updateAvailability(accessory, 'remove');
        }
        return { status: 'Car configuration updated successfully' };
    } catch (err) {
        return { error: err.message };
    }
};

exports.saveNewConfiguration = async (car_configuration) => {
    try {
        const accessory_constraints = await getAccessoryConstraints();
        await checkAccessories(car_configuration.carModelId, car_configuration.accessories, accessory_constraints);

        const insert_sql = 'INSERT INTO car_configurations (userId, carModelId) VALUES (?, ?)';
        await new Promise((resolve, reject) => {
            db.run(insert_sql, [car_configuration.userId, car_configuration.carModelId], (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });

        await updateAccessories(car_configuration.userId, car_configuration.accessories);
        for (const accessory of car_configuration.accessories) {
            await updateAvailability(accessory, 'remove');
        }
        await new Promise((resolve, reject) => {
        const updateUser_sql = 'UPDATE users SET hasConfig = ? WHERE id = ?'
        db.run(updateUser_sql, [true, car_configuration.userId], function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
        return { status: 'Car configuration saved successfully' };
    } catch (err) {
        return { error: err.message };
    }
};
exports.deleteConfiguration = (user_id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT userId FROM car_configurations WHERE userId = ?';
        db.get(sql, [user_id], (err, row) => {
            if (err) {
                return reject(err);
            }

            if (!row) {
                return resolve({ message: 'No configuration found for user' });
            }

            const get_accessories_sql = 'SELECT accessoryId FROM selected_accessories WHERE userId = ?';
            db.all(get_accessories_sql, [user_id], async (err, accessoryRows) => {
                if (err) {
                    return reject(err);
                }

                const accessoryIds = accessoryRows.map(row => row.accessoryId);

                try {
                    const delete_accessories_sql = 'DELETE FROM selected_accessories WHERE userId = ?';
                    db.run(delete_accessories_sql, [user_id], function (err) {
                        if (err) {
                            return reject(err);
                        }

                        const delete_config_sql = 'DELETE FROM car_configurations WHERE userId = ?';
                        db.run(delete_config_sql, [user_id], async function (err) {
                            if (err) {
                                return reject(err);
                            }

                            for (const accessoryId of accessoryIds) {
                                await updateAvailability(accessoryId, 'add');
                            }

                            const updateUser_sql = 'UPDATE users SET hasConfig = ? WHERE id = ?';
                            db.run(updateUser_sql, [false, user_id], function (err) {
                                if (err) {
                                    return reject(err);
                                }

                                resolve({ message: 'Car configuration deleted successfully' });
                            });
                        });
                    });
                } catch (err) {
                    return reject(err);
                }
            });
        });
    });
};