import * as mysql2 from "mysql2/promise";
import IModel from "./IModel.interface";
import IAdapterOptions from './IAdapterOptions.interface';
import IServiceData from "./IServiceData.interface";
import IApplicationResources, { IServices } from "./IApplicationResources.interface";

export default abstract class BaseService<ReturnModel extends IModel, AdapterOptions extends IAdapterOptions> {
    private database: mysql2.Connection;
    private serviceInstances: IServices;

    constructor (resources: IApplicationResources) {
        this.database = resources.databaseConnection;
        this.serviceInstances = resources.services;
    }

    protected get db(): mysql2.Connection {
        return this.database;
    }

    protected get services(): IServices {
        return this.serviceInstances;
    }


    abstract tableName():string;
    abstract adaptToModel(data: any, options: AdapterOptions): Promise<ReturnModel>

    protected async getAllByFieldNameAndValue(fieldName: string, value: any, options: AdapterOptions): Promise<ReturnModel[]> {
        const tableName = this.tableName();

        return new Promise<ReturnModel[]>

            return resolve([]);
                        }


     public getAll(options: AdapterOptions): Promise<ReturnModel[]>{
        const tableName = this.tableName();
        return new Promise<ReturnModel[]>(
            (resolve, reject) => {
               const sql: string = `SELECT * FROM \`${tableName}\`;`;
               this.db.execute(sql)
                    .then(async([rows]) => {
                       if(rows === undefined){
                           return resolve([]);
                       }
                       const items: ReturnModel[] = [];
   
                       for (const row of rows as mysql2.RowDataPacket[]){
                               
                           items.push(await this.adaptToModel(row, options));
                         
                              
                       }
                       resolve(items);
                    })
                    .catch(error =>{
                        reject(error);
                    })
           });
     };
     public getById(id: number, options: AdapterOptions): Promise<ReturnModel|null> {

     const tableName = this.tableName();

     return new Promise<ReturnModel>(
        (resolve, reject) => {
            const sql: string = `SELECT * FROM \`${tableName}\` WHERE ${tableName}_id = ?; `;

            this.db.execute(sql, [id])
            .then(async([rows]) => {
                if(rows === undefined){
                    return resolve(null);
                }

                if(Array.isArray(rows) && rows.length == 0){
                    return resolve(null);
                }

               resolve(await this.adaptToModel(rows[0], options));
             })
             .catch(error =>{
                 reject(error);
             })
        }
    );
}

protected async baseAdd(data: IServiceData, options: AdapterOptions): Promise<ReturnModel> {
        const tableName = this.tableName();

        return new Promise((resolve, reject) => {
            const properties = Object.getOwnPropertyNames(data);
            const sqlPairs = properties.map(property => "`" + property + "` = ?").join(", ");
            const values = properties.map(property => data[property]);

            const sql: string = "INSERT `"+ tableName +"` SET " + sqlPairs +";";

            this.db.execute(sql, values)
                .then(async result=> {
                    const info: any = result;

                    const newItemId = +(info[0]?.insertId);

                    const newItem: ReturnModel|null = await this.getById(newItemId, options);

                    if (newItem == null) {
                        reject({
                            message: 'Could not add a new item into the' + tableName + 'teble', });
                    }
                    resolve(newItem);

                }) 
                .catch(error => {
                    reject(error);
                });
        });
    }

    protected async baseEditById(id: number, data: IServiceData, options: AdapterOptions): Promise<ReturnModel> {
        const tableName = this.tableName();

        return new Promise((resolve, reject) => {
            const properties = Object.getOwnPropertyNames(data);
            const sqlPairs = properties.map(property => "`" + property + "` = ?").join(", ");
            const values = properties.map(property => data[property]);
            values.push(id);

            const sql: string = "UPDATE `"+ tableName +"` SET " + sqlPairs +"WHERE `" + tableName + "_id` = ?;";

            this.db.execute(sql, values)
            .then(async result=> {
                const info: any = result;

                if (info[0]?.affectedRows === 0){
                    return reject({message: "could not change any items in the " +tableName+ "table", });
                }

                const item: ReturnModel|null = await this.getById(id, options);

                if (item == null) {
                    reject({
                        message: 'Could not find this item in the' + tableName + 'teble', });
                }
                resolve(item);

            }) 
            .catch(error => {
                reject(error);
            });
        });
    }

}

