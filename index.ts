import * as cheerio from 'cheerio';
import * as iconv from "iconv-lite";
import * as request from 'request-promise';

import { MongoConnection, Repository } from './respository';
import { XmlWriter } from './xmlwriter';

export class Index {

    /**
     * Main base url
     */
    private readonly baseUrl: string = "https://www.sinonimos.com.br/";

    /**
     * First word to start crawl the server
     */
    private readonly firstUrlPath: string = "a";

    /**
     * Reference to named repository
     */
    private db: Repository<Scope>;

    /**
     * Constructs an instance of this class
     */
    constructor() {
        this.db = new Repository(Scope, new MongoConnection());
    }

    /**
     * Run the app doing the first request to get the next continuous list of links
     * to crawl the entire list of words available inside the sinonimos server.
     * 
     * @param nextUrl Next url to run a recursive call
     * @param firstRun Tells if is this a first run of this app
     */
    public async run(nextUrl: string = "", firstRun: boolean = true): Promise<void | {}> {
        const self = this;
        const {
            db,
            firstUrlPath,
            baseUrl
        } = self;

        let requestUrl = nextUrl === "" ? baseUrl + firstUrlPath : nextUrl;

        try {
            console.log(`Next url -> ${requestUrl}`);
            self.doRequest(requestUrl).then(($: CheerioStatic) => {
                let nextLinks: Link[] = [];
                if (firstRun) {
                    db.add(self.extractWord({
                        url: requestUrl,
                        description: this.first(requestUrl.match(/[^/]+$/))
                    }, $), { word: this.first(requestUrl.match(/[^/]+$/)) });
                }
                (nextLinks = self.getNextLinks($)).forEach((link: Link, idx: number, arr: Link[]) => {
                    self.doRequest(link.url).then(($: CheerioStatic) => {
                        db.add(
                            self.extractWord(link, $), 
                            { word: link.description }
                        );

                        if (arr.length === (idx + 1)) {
                            self.run((<Link>self.last(nextLinks)).url, false);
                        }
                    });
                });
            });
        }
        catch (err) {
            console.log(err);
        }
    }

    /**
     * Do request, to given url.
     * 
     * @param url Url to be requested
     * @returns A promise with `pending` status, that will be fullfiled when request reaches the url 
     */
    private doRequest(url: string): request.RequestPromise {
        var self = this;

        return request(url + "/", {
            method: "GET",
            encoding: null,
            headers: {
                "User-Agent": self.getUserAgent(),
                "Origin": self.baseUrl,
                "Referer": self.baseUrl,
                "Content-Type": "text/html; charset=iso-8859-1"
            },
            timeout: 5000,
            transform: (html: string) => {
                var decodedString = iconv.decode(Buffer.from(html), "iso-8859-1");
                return cheerio.load(decodedString);
            }
        })
    }

    /**
     * Extract the word and his given senses from crawled page
     * 
     * @param link Link that was crawled the given page
     * @param $ Dom node representation for the html inside the given link
     * @returns A scope full with synonymous for found word
     */
    private extractWord(link: Link, $: CheerioStatic): Scope {
        let scope: Scope = {
            word: link.description,
            senses: []
        };

        $("#content").find(".s-wrapper").each((idx: number, el: CheerioElement) =>
            scope.senses.push({
                description: $(el).find(".sentido").text().replace(":", ""),
                synomn: [].slice.call(
                    $(el).find(".sinonimos").find("a, span").map((ixd, el) => $(el).text())
                )
            })
        );

        return scope;
    }

    /**
     * Get the next list of links to be crawled
     * 
     * @param $ Dom node from html page previously crawled
     */
    private getNextLinks($: CheerioStatic): Link[] {
        return $("ul.lig-next a").toArray().map((a: any) => {
            return <Link>{
                url: this.baseUrl + $(a).attr("href").replace(/\//g, ''),
                description: $(a).text()
            }
        });
    }

    /**
     * User agent to request agent
     * 
     * @returns {string} User agent to be used as a client
     */
    private getUserAgent(): string {
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36";
    }

    /**
     * Get the last element inside an array
     * 
     * @param arr {Array[]} Array of elements to be extract its last element
     * @returns The last element inside the given array
     */
    private last(arr: any[]): any {
        return arr[arr.length - 1];
    }

    /**
     * Get the first element inside the given array
     * 
     * @param arr {Array[]} Array of elements to be extracted its first element
     * @returns The first element inside the given array 
     */
    private first(arr: any[]): any {
        return arr[0];
    }
}

/**
 * Link representation for `https://www.sinonimos.com.br/` web site
 */
interface Link {

    /**
     * Url for the hyperlink
     */
    url: string;

    /**
     * Associated description
     */
    description: string;
}

/**
 * The sense for a crawled word
 */
export class Sense {

    /**
     * Full description
     */
    description: string;

    /**
     * List of synonymous to given word
     */
    synomn: string[];
}

/**
 * Scope of word synonymous
 */
export class Scope {

    /** 
     * Word with his senses
     */
    word: string;

    /**
     * Full senses provided by `https://www.sinonimos.com.br/` web site
     */
    senses: Sense[];
}

new Index().run(); //<-- uncoment this if you want put all words inside mongo db database
//new XmlWriter().generate(); //<-- uncoment this if you want generate a xml with theasaurus layout
