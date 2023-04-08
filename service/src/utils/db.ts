import mysql from 'mysql';
import { isNotEmptyString } from './is';

let pool = null;
const fetch = require('node-fetch');

const createPool = () => {
  const host = isNotEmptyString(process.env.DB_HOST) ? process.env.DB_HOST : '47.106.136.180';
  const user = isNotEmptyString(process.env.DB_USER) ? process.env.DB_USER : 'chatgpt';
  const port = isNotEmptyString(process.env.DB_PORT) ? process.env.DB_PORT : '3306';
  const password = isNotEmptyString(process.env.DB_PASSWORD) ? process.env.DB_PASSWORD : '123456';
  const database = isNotEmptyString(process.env.DB_DATABASE) ? process.env.DB_DATABASE : 'chatgpt';

  pool = mysql.createPool({
    connectionLimit: 10, // 设置连接池大小
    host,
    user,
    port,
    password,
    database,
  });
};

// 创建连接池
createPool();

// 定义异步函数来插入新消息
async function insertMessage(message) {
  const sql = 'INSERT INTO chatgpt_message SET ?';
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        connection.query(sql, message, (error, results, fields) => {
          connection.release(); // 释放连接到连接池
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        });
      }
    });
  });
}

export async function addMessage(message) {
  try {
    const messageId = await insertMessage(message);
    console.log(`New message has been inserted with ID: ${messageId}`);
  } catch (error) {
    console.error(error);
  }
}

async function getAddress(ip) {
  try {
    const url = `https://ipapi.co/${ip}/json/`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      city: data.city,
      region: data.region,
      country: data.country_name
    };
  } catch (err) {
    console.error(`Failed to get address: ${err}`);
    return null;
  }
}

function getIpInfo(req) {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = ipAddress.split(',')[0];
    return getAddress(ip);
  } catch (err) {
    console.error(`Failed to get IP info: ${err}`);
    return null;
  }
}
