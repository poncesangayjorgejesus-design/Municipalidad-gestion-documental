-- Edita la contraseña y usa el mismo valor en .env antes de ejecutar este archivo.
CREATE USER IF NOT EXISTS 'app_yau'@'%' IDENTIFIED BY 'YauDemo2026_db';
GRANT SELECT, INSERT, UPDATE ON municipalidad_yau.* TO 'app_yau'@'%';
