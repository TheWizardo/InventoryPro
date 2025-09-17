@echo off
REM Backup MongoDB running in Docker

REM === CONFIG ===
set CONTAINER_NAME=mongo
set DB_NAME=<db_Name>
set HOST_BACKUP_DIR=%programdata%\InventoryPro\mongo_backups
set CONTAINER_BACKUP_DIR=/backup

REM === Get timestamp in YYYY-MM-DD_HH-MM ===
for /f "skip=1" %%x in ('wmic os get localdatetime') do if not defined mydate set mydate=%%x

set YYYY=%mydate:~0,4%
set MM=%mydate:~4,2%
set DD=%mydate:~6,2%
set HH=%mydate:~8,2%
set MN=%mydate:~10,2%

set TIMESTAMP=%YYYY%-%MM%-%DD%_%HH%-%MN%

@echo on
echo timestamp %TIMESTAMP%
@echo off
set HOST_TIMESTAMP_DIR=%HOST_BACKUP_DIR%\%TIMESTAMP%
@echo on
echo host dir %HOST_TIMESTAMP_DIR%
@echo off

REM === CLEAR CONTAINER BACKUP FOLDER ===
echo Clearing container backup folder: %CONTAINER_BACKUP_DIR%
docker exec %CONTAINER_NAME% rm -rf %CONTAINER_BACKUP_DIR%/*

REM === CREATE BACKUP INSIDE CONTAINER ===
echo Creating backup in container...
docker exec %CONTAINER_NAME% mongodump --db %DB_NAME% --out %CONTAINER_BACKUP_DIR%

REM === COPY TO HOST MACHINE ===
echo Copying backup to host folder: %HOST_TIMESTAMP_DIR%
mkdir "%HOST_TIMESTAMP_DIR%"
docker cp %CONTAINER_NAME%:%CONTAINER_BACKUP_DIR% "%HOST_TIMESTAMP_DIR%"

echo Backup complete! Saved to: %HOST_TIMESTAMP_DIR%
