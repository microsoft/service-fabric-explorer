import { Component, Input, OnChanges, OnInit } from '@angular/core';
import initSqlJs, { Database } from 'sql.js';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';

const isoChecker = new RegExp(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/);

const getPropertyList = (object, prefix = "") => {

  let columns = [];
  let flattenedObject = {};
  Object.keys(object).forEach(key => {
    const value = object[key];
    const properKey = prefix + key;
    const type = typeof value;

    let isObj = false;

    if (type === "string") {
      if (isoChecker.test(value)) {
        // columns.push({
        //     key: properKey,
        //     type: 'date'
        // })
      } else {
        columns.push({
          key: properKey,
          type: 'MEDIUMTEXT'
        })
      }
    } else if (type === "number") {
      columns.push({
        key: properKey,
        type: object[properKey] % 1 === 0 ? 'INTEGER' : 'FLOAT'
      })
    } else if (type === "boolean") {
      columns.push({
        key: properKey,
        type: 'BOOLEAN'
      })
    } else if (type === "object" && !Array.isArray(value)) {
      const result = getPropertyList(value, key + "_");
      columns = columns.concat(result.columns);
      flattenedObject = { ...flattenedObject, ...result.properties }
      isObj = true;
    }

    if (!isObj) {
      flattenedObject[properKey] = value;
    }
  })

  return { columns, properties: flattenedObject };
}

const getPropertiesFromList = (objects) => {
  const allProperties = [];
  const seenProperties = new Set();

  const flattenedObjects = [];
  objects.forEach(obj => {
    const objProperties = getPropertyList(obj);
    flattenedObjects.push(objProperties.properties);
    objProperties.columns.forEach(obj => {
      if (!seenProperties.has(obj.key)) {
        allProperties.push(obj);
        seenProperties.add(obj.key)
      }
    })
  })

  return { allProperties, flattenedObjects };
}


export interface ISQLConfig {
  data: any[];
  name: string;

}

@Component({
  selector: 'app-sql-query',
  templateUrl: './sql-query.component.html',
  styleUrls: ['./sql-query.component.scss']
})
export class SqlQueryComponent implements OnChanges {

  @Input() data: ISQLConfig[];

  queryString = "";
  db: Database;
  result = {};
  resultTableSettings: ListSettings;

  tables = [];

  constructor() { }

  ngOnChanges(): void {
    console.log(this.data)
    // const initSqlJs = require('sql.js');
    initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`

    }).then(SQL => {
      // Create a database
      const db = new SQL.Database();
      this.db = db;
      // NOTE: You can also use new SQL.Database(data) where
      // data is an Uint8Array representing an SQLite database file


      this.data.forEach(dataset => {
        const properties = getPropertiesFromList(dataset.data);
        console.log(properties);
        this.tables.push({
          name: dataset.name,
          properties
        })

        // Execute a single SQL string that contains multiple statements
        if (properties.allProperties.length > 0) {
          const createTableLine = `CREATE TABLE ${dataset.name} (${properties.allProperties.map((key, index) => key.key + " " + key.type)})`;

          const prefix = `INSERT INTO ${dataset.name} VALUES `;
          let rows = "";
          properties.flattenedObjects.forEach(obj => {
            const propertiesList = [];

            properties.allProperties.forEach(prop => {
              if (prop.key in obj) {
                if (prop.type === "MEDIUMTEXT") {
                  propertiesList.push(`"${obj[prop.key]}"`)

                } else {
                  propertiesList.push(obj[prop.key])
                }
              } else {
                propertiesList.push('null')
              }
            })

            rows += `${prefix} (${propertiesList}); \n`
          })

          let sqlstr = `${createTableLine}; ${rows}`;
          const r = db.run(sqlstr); // Run the query without returning anything
        }
      })

    })
  }

  query() {
    try {
      console.log(this.queryString)
     this.result = this.db.exec(this.queryString);
      console.log(this.result);
     this.resultTableSettings = new ListSettings(100, [], 'results', []);
     const columns = this.result[0].columns;
     columns.forEach(column => {
      this.resultTableSettings.columnSettings.push(new ListColumnSetting(column, column));
     })

     this.result['objs'] = this.result[0].values.map(items => {
      const r = {};
      columns.forEach((column, i) => {
        r[column] = items[i];
      })

      return r;
     })

    } catch(e) {
      this.resultTableSettings = null;
      this.result = {
        error: e.toString()
      }
    }
  }

}
