BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "cars" (
	"id" INTEGER,
	"name"	TEXT NOT NULL,
	"engPowerKW"	INTEGER CHECK("engPowerKW" IN (50,100,150)),
	"costEuros"	INTEGER CHECK("costEuros" IN (10000,12000,14000)),
    "maxNumAccessories" INTEGER CHECK("maxNumAccessories" IN (4,5,7)),
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER,
	"email"	TEXT NOT NULL UNIQUE,
	"name"	TEXT,
	"hash"	TEXT NOT NULL,
	"salt"	TEXT NOT NULL,
	"goodCustomer"	BOOLEAN DEFAULT 0,
    "hasConfig" BOOLEAN NOT NULL DEFAULT 0,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "accessories" (
    "id" INTEGER,
    "name" TEXT NOT NULL,
    "priceEur" INTEGER NOT NULL CHECK("priceEur" > 0),
    "availability" INTEGER NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT)
);
-- incompatibility? check dependency 2nd one present in order to add 1st one: if one of the 2 present then incompatible.
CREATE TABLE IF NOT EXISTS "accessory_constraints" (
    "accessoryId" INTEGER NOT NULL,
    "requiredAccessoryId" INTEGER,
    "incompatibleAccessoryId" INTEGER,
    PRIMARY KEY ("accessoryId"),
    FOREIGN KEY("accessoryId") REFERENCES accessories(id),
    FOREIGN KEY("requiredAccessoryId") REFERENCES accessories(id),
    FOREIGN KEY("incompatibleAccessoryId") REFERENCES accessories(id)
);
-- primary key on userId since for each user there's only one configuration
CREATE TABLE IF NOT EXISTS "car_configurations" (
    "userId" INTEGER NOT NULL,
    "carModelId" INTEGER NOT NULL,
    FOREIGN KEY("userId") REFERENCES users(id),
    FOREIGN KEY ("carModelId") REFERENCES cars(id),
    PRIMARY KEY (userId)
);

CREATE TABLE IF NOT EXISTS "selected_accessories" (
    "userId" INTEGER NOT NULL,
    "accessoryId" INTEGER NOT NULL,
    FOREIGN KEY("userId") REFERENCES users(id),
    FOREIGN KEY ("accessoryId") REFERENCES accessories(id),
    PRIMARY KEY (userId, accessoryId)
);

-- Populating the DB...
INSERT INTO cars (name, engPowerKW, costEuros, maxNumAccessories) VALUES 
('Giulietta', 50, 10000, 4),
('Stelvio', 100, 12000, 5),
('Giulia', 150, 14000, 7);

-- (pwd: admin)
INSERT INTO users (email, name, hash, salt, goodCustomer, hasConfig) VALUES 
('mario.rossi@email.com', 'Mario', 'add353259edd9a237aa7d3c57d623144469e3218b4cb60e5bfbaa9a7fbaef607', '38ab4e73598f44b8', 1, 1),
('maria.verdi@email.com', 'Maria', '39170b8a2fd1c0096f79bccda72f07a4878280ad8f386ae33944dffc28d33bd6', '57f4318fd2015445', 1, 0),
('luigi.bianchi@email.com', 'Luigi', 'e724a24b373d1d66980e62e402edcd78d5c92ee1cf5e3ccfe37b38f1a67b4bfe', '3f0d0188522c8d45', 0, 1),
('mark.brown@email.com', 'Mark', 'e427f4568b181aa49dcf3b0d9debb03f15cb43b992fdb83b3d4da7ab70d568ce', '333d2af81cfb0b48', 0, 0),
('julia.white@email.com', 'Julia', '6ae2fa2720465933b239dd564bba53e5b656e9b616619839e147d7a325e1a3f2', 'ce826dc0015704d9', 0, 1);


INSERT INTO accessories (name, priceEur, availability) VALUES
('Radio', 300, 8),
('Satellite Navigator', 600, 9),
('Bluetooth', 200, 8),
('Power Windows', 200, 8),
('Extra Front Lights', 150, 9),
('Extra Rear Lights', 150, 9),
('Air Conditioning', 600, 1),
('Spare Tire', 200, 10),
('Assisted Driving', 1200, 2),
('Automatic Braking', 800, 2);

INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (1, NULL, NULL);
INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (2, 3, NULL);
INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (3, 1, NULL);
INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (4, NULL, NULL);
INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (5, NULL, NULL);
INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (6, 5, NULL);
INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (7, 4, 8);
INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (8, NULL, 7);
INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (9, NULL, 10);
INSERT INTO accessory_constraints ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (10, NULL, 9);

-- Good client with 150 KW saved car
INSERT INTO car_configurations (userId, carModelId) VALUES 
((SELECT id FROM users WHERE email = 'mario.rossi@email.com'), (SELECT id FROM cars WHERE engPowerKW = 150));

-- Not-good-client user with 100 KW saved car
INSERT INTO car_configurations (userId, carModelId) VALUES 
((SELECT id FROM users WHERE email = 'luigi.bianchi@email.com'), (SELECT id FROM cars WHERE engPowerKW = 100));

-- User with 50 KW saved car
INSERT INTO car_configurations (userId, carModelId) VALUES 
((SELECT id FROM users WHERE email = 'julia.white@email.com'), (SELECT id FROM cars WHERE engPowerKW = 50));

-- Insert selected accessories for good client with 150 KW saved car
-- can't insert anymore (power windows manually inserted for A/C constraint)
INSERT INTO selected_accessories (userId, accessoryId) VALUES
((SELECT id FROM users WHERE email = 'mario.rossi@email.com'), (SELECT id FROM accessories WHERE name = 'Automatic Braking')),
((SELECT id FROM users WHERE email = 'mario.rossi@email.com'), (SELECT id FROM accessories WHERE name = 'Extra Front Lights')),
((SELECT id FROM users WHERE email = 'mario.rossi@email.com'), (SELECT id FROM accessories WHERE name = 'Extra Rear Lights')),
((SELECT id FROM users WHERE email = 'mario.rossi@email.com'), (SELECT id FROM accessories WHERE name = 'Radio')),
((SELECT id FROM users WHERE email = 'mario.rossi@email.com'), (SELECT id FROM accessories WHERE name = 'Bluetooth')),
((SELECT id FROM users WHERE email = 'mario.rossi@email.com'), (SELECT id FROM accessories WHERE name = 'Power Windows')),
((SELECT id FROM users WHERE email = 'mario.rossi@email.com'), (SELECT id FROM accessories WHERE name = 'Air Conditioning'));

-- Insert selected accessories for not-good-client user with 100 KW saved car
-- can't insert anymore (power windows manually inserted for A/C constraint)
INSERT INTO selected_accessories (userId, accessoryId) VALUES
((SELECT id FROM users WHERE email = 'luigi.bianchi@email.com'), (SELECT id FROM accessories WHERE name = 'Radio')),
((SELECT id FROM users WHERE email = 'luigi.bianchi@email.com'), (SELECT id FROM accessories WHERE name = 'Bluetooth')),
((SELECT id FROM users WHERE email = 'luigi.bianchi@email.com'), (SELECT id FROM accessories WHERE name = 'Satellite Navigator')),
((SELECT id FROM users WHERE email = 'luigi.bianchi@email.com'), (SELECT id FROM accessories WHERE name = 'Power Windows')),
((SELECT id FROM users WHERE email = 'luigi.bianchi@email.com'), (SELECT id FROM accessories WHERE name = 'Air Conditioning'));

COMMIT;

