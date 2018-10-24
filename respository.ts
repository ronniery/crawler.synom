import * as mongodb from "mongodb";

/**
 * Defines the generic class to handle the manipulations with the database
 * 
 * @export
 * @class Repository
 * @template T The abstract type to be manipulated by this class
 * into database
 */
export class Repository<T extends Object> {

    /**
     * Generic way to get the name of generic class type
     * 
     * @private
     * @returns {string}
     * 
     * @memberof Repository
     */
    private get entityName(): string {
        return (new this.type()).constructor.name;
    }

    /**
     * Creates an instance of Repository.
     * 
     * @param {string} colName Collection name for do some operations
     * 
     * @memberof Repository
     */
    public constructor(private type, private con: Connection) { }

    /**
     * Add the given entity into persisted database
     * 
     * @param {T} entity Object to be added
     * @returns {Promise<T>} Promise with add/save function
     * 
     * @memberof Repository
     */
    public async add(entity: T, addFilter: Object): Promise<void | mongodb.InsertOneWriteOpResult> {
        const self = this;

        return new Promise<mongodb.InsertOneWriteOpResult>((resolve): void => {
            self.con.connect().then((db: mongodb.Db) => {
                db.collection(self.entityName).find(addFilter).limit(1).next((err, doc) => {
                    if (!doc) {
                        db.collection(self.entityName).insertOne(entity, (err, result) => {
                            resolve(result);
                        });

                        return;
                    }

                    resolve();
                });
            });
        }).catch((reject: any) => {
            console.error("Error when try crawl in a promise, reject reason (", reject, ")");
        });
    }

    /**
     * Find the first doc that matches with the given query
     * 
     * @param query Current query to search on db
     * @returns {Promise<T[]>} The found array of elements
     * 
     * @memberof Repository
     */
    public async find(query: Object = {}): Promise<void | T[]> {
        const self = this;

        try {
            return new Promise<T[]>((resolve): void => {
                self.con.connect().then((db: mongodb.Db) => {
                    resolve(db.collection(self.entityName)
                        .find(query).toArray());
                });
            });
        }
        catch (error) {
            console.error("Error when try crawl in a promise, reject reason (", error, ")");
        }
    }
}

/**
 * Configuration factory to generate multiple connections to different type of dbs
 * 
 * @export 
 * @class ConnectionFactory
 */
abstract class Connection {

    /**
     * Db name
     * 
     * @property
     */
    protected dbName: string;


    /**
     * Constructs an instance of connection to a given db
     * 
     * @param dbUrl {string} Url where the db is.
     */
    constructor(
        public dbUrl: string = "mongodb://localhost:27017"
    ) {
        this.dbName = "synomn"
    }

    /**
     * Connect with the parametrized connection defined on the class, that extends this.
     */
    public abstract connect(): Promise<void | mongodb.Db>;
}

/**
 * Mongo connection class that knows how access and create a connection to mongo database
 */
export class MongoConnection extends Connection {

    /**
     * Connect with mongo db database
     */
    public connect(): Promise<void | mongodb.Db> {
        const { MongoClient } = mongodb;
        const self = this;

        return new Promise((resolve, reject) => {
            MongoClient.connect(self.dbUrl, {
                useNewUrlParser: true
            }).then(client => {
                resolve(client.db(self.dbName));
            }).catch(err => {
                reject(err);
            });
        })
    }
}

export default Repository;
