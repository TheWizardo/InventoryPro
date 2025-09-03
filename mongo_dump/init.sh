#!/bin/bash
set -e

echo "Seeding MongoDB..."

until mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" | grep 1 > /dev/null; do
  echo "Waiting for MongoDB to start..."
  sleep 2
done

echo "MongoDB is up, importing data..."

mongoimport --db <db_name> --collection Projects --drop --file Projects.json --jsonArray
mongoimport --db <db_name> --collection Employees --drop --file Employees.json --jsonArray
mongoimport --db <db_name> --collection Inventory --drop --file Inventory.json --jsonArray
mongoimport --db <db_name> --collection InventoryLog --drop --file InventoryLog.json --jsonArray
mongoimport --db <db_name> --collection Assembly --drop --file Assembly.json --jsonArray

echo "MongoDB seeding complete."
