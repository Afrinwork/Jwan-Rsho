@echo off
rem Started daily by the Windows task "Rsho Datenbank-Backup".
cd /d "%~dp0..\.."
if not exist backups mkdir backups
node scripts\backup\backupDatabase.cjs >> backups\backup.log 2>&1
