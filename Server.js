//This sets up server to listen on port 8080 and host localhost

const http = require("http");


const fs = require("fs").promises;

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const puppeteer = require('puppeteer');
const axios = require('axios');




const host = "localhost";
const port = 8080;

let indexFile; //file for html
let Account;


const requestListener = function (req, res) {
    if (req.method === 'POST' && req.url === '/submit') {
        let user = '';
        req.on('data', chunk => {
            user += chunk.toString();
        });
        user = user.replace('User=','');
        req.on('end', async () => {
            console.log(user);
            account = new Profile(user);
            let amount = await account.getReplaysArray();
            await account.Winrate(account.replays, 'none', 'none');
            if (amount === 0) {
                res.setHeader("Content-Type", "text/html");
                res.writeHead(200);
                let modifiedIndexFile = indexFile.replace('<!--notification-->', '<p>User does not exist or they dont have any replays</p>');
                res.end(modifiedIndexFile);
            }
            else {
                res.setHeader("Content-Type", "text/html");
                res.writeHead(200);
                await fs.readFile(__dirname + "/Data report.html", "utf8")
                .then(contents => {
                    indexFile = contents;
                })
                .catch(err => {
                    console.error(`Could not read index.html file: ${err}`);
                    process.exit(1);
                });
                let newIndexFile = indexFile.replace('<!--User/Amount-->', `<p>${user.replace('User=','')} has ${amount} replays.</p>`);
                res.end(newIndexFile);
            }
        });
    }
    else if(req.method === 'Post' && req.url === '/mod') {
        let change = '';
        req.on('data', chunk => {
            change += chunk.toString();
        });
        let params = change.split('&');
        let AType = params[0].replace('Analysis=','');
        let MType = params[1].replace('ModType=','');
        let Mod = params[2].replace('User=','');
        req.on('end', async () => {
            console.log(AType);
            console.log(MType);
            console.log(Mod);
            
        });


    }
    else {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end(indexFile);
    }

};

const server = http.createServer(requestListener);

fs.readFile(__dirname + "/base.html", "utf8")
    .then(contents => {
        indexFile = contents;
        server.listen(port, host, () => {
            console.log(`Server is running on http://${host}:${port}`);
        });
    })
    .catch(err => {
        console.error(`Could not read index.html file: ${err}`);
        process.exit(1);
    });

class Profile {
    constructor(user) {
        this.user = user.replace('User=','');
        this.replays = [];
        this.amount = 0;
        this.link = "https://replay.pokemonshowdown.com/?user=";
    }
    async getReplaysArray() {
            
        let url = this.link + this.user;
        console.log(url);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        const links = await page.$$eval('a', as => as.map(a => a.href));
        this.replays = links;
        await browser.close();
        this.replays = this.replays.slice(6);
        return this.amount = this.replays.length;
    }
    async Modifications(A,M,Mod){
            
    }
    async Winrate(array, mod, Mtype){
        console.log('winrate');
        console.log(array.length);
        let wins = 0;
        let data = '';
        let whichPlayer = false;//false is player 1, true is player 2
        let loop = true;

        for (let i = 0; i < array.length; i++) {
            if (array[i][array[i].length - 3] === '?') {
                array[i] = array[i].slice(0, -3);
            }
            let url = array[i] + '.log';
            console.log(url);
            
            try{
                const response = await axios.get(url);
                data = response.data;
                //console.log(response.data);
            }
            catch (error) {
                console.error(error);
            }
            let lines = data.split('\n');
            switch(Mtype){
                case 'none':// done
                    for (let j = lines.length - 2; j >= 0; j--){ // -2 since last line is empty
                        if (lines[j].split('|')[1] === 'win') {
                            if (lines[j].split('|')[2].toLowerCase() === this.user.toLowerCase()) {
                                wins++;
                                break;
                            }
                            break;
                        }
                    }
                    break;
                case 'user':
                    for (let j = 0; j < lines.length; j++) {
                        if (lines[j].split('|')[1] === 'player') {
                            if (mod.toLowerCase() !== lines[j].split('|')[3].toLowerCase()) {
                                if (lines[j + 1].split('|')[3].toLowerCase() !== mod.toLowerCase()) {
                                    break;
                                }
                            }
                            
                        }
                        //this is an else if since it should only eval a few times before exiting or not being read
                        else if (lines[j].split('|')[0] === 'player') { //this if statement evals if there is a player block
                            let username = lines[j].split('|')[2].toLowerCase();
                            if (username !== this.user.toLowerCase()) {
                                if( sec !== mod){
                                    break;// ealry exit
                                }
                                has = true;
                                
                            }
                            
                        }
                    }
                    break;
                case 'poke'://heere
                    whichPlayer = this.findPlayer(lines[0]);
                    break;
                case 'move':
                    if (lines[0].split('|')[0] === 'player') { //need to establish effectively who is playe one
                        if (lines[0].split('|')[2].toLowerCase() === this.user.toLowerCase()) {
                            let NeedThis = lines[0].split('|')[1];
                        }
                    }
                    break;
                case 'type':
                    break;
            }
                
                
            /*for (let j = 0; j < lines.length && loop; j++) {
                if (has === false && lines[j].split('|')[0] !== 'c') {//makes sur i tis not a chat message if has ha snot been altered
                    switch (Mtype) {
                        case'none':
                            has = true;
                            break;
                        case 'user':
                            if (lines[j].includes('|player|')) { //this if statement evals if there is a player block
                                let sec = lines[j].split('|')[2].toLowerCase();
                                if (sec !== this.user.toLowerCase()) {
                                    if( sec !== mod){
                                        loop = false;// we dont need to check the rest of the replay
                                        break;// ealry exit
                                    }
                                }
                                has = true;
                                break;  
                            }
                            break;
                        case 'poke':
                            if (NeedThis !== ''){
                                NeedThis = await this.findPlayer(lines[j], this.user);
                            }
                            if (lines[j].split('|')[0] === 'switch' && lines[j].split('|')[1].split('a')[0] === NeedThis) {
                                if (lines[j].split('|')[1].split(' ')[1].toLowerCase() === mod.toLowerCase()) {
                                    has = true;
                                    break;
                                }
                            }
                            
                        case 'move':
                            if (NeedThis !== ''){
                                NeedThis = await this.findPlayer(lines[j], this.user);
                            }
                            if (lines[j].split('|')[0] === 'move' && lines[j].split('|')[1].split('a')[0] === NeedThis) {
                                if (lines[j].split('|')[2].toLowerCase() === mod.toLowerCase) {
                                    has = true;
                                    break;
                                }
                            }
                            if (j === 0 ){
                                fs.readFile(__dirname + "/PokData.txt", "utf8")
                                    .then(contents => {
                                        let check = contents.split('\n');
                                        noLoop = true;
                                        for (let k = 0; k < check.length; k++) {
                                            if (mod.toLowerCase() === check[k].split('\t')[0].toLowerCase()) {
                                                noLoop = false;
                                                break;
                                            }
                                        }
                                    })
                                    .catch(err => {
                                        console.error(`Could not read index.html file: ${err}`);
                                        process.exit(1);
                                    });
                                
                            }
                            break;
                            
                        case 'type':
                            
                        break;
                    }
                    
                }
                
            }*/
        }
        console.log(wins);
    }

    async existsPoke(poke){
        fs.readFile(__dirname + "/PokData.txt", "utf8")
            .then(contents => {
                let check = contents.split('\n');
                for (let k = 0; k < check.length; k++) {
                    if (poke.toLowerCase() === check[k].split('\t')[0].toLowerCase()) {
                        return false;
                    }
                }
                return true;
            })
            .catch(err => {
                console.error(`Could not read index.html file: ${err}`);
                process.exit(1);
            });
    }
    async existsType(type){
        fs.readFile(__dirname + "/TypeData.txt", "utf8")
            .then(contents => {
                let check = contents.split('\n');
                for (let k = 0; k < check.length; k++) {
                    if (type.toLowerCase() === check[k].split('\t')[0].toLowerCase()) {
                        return false;
                    }
                }
                return true;
            })
            .catch(err => {
                console.error(`Could not read index.html file: ${err}`);
                process.exit(1);
            });
    }
    async findPlayer(line){
        if (line.split('|')[0] === ('player')) { //need to establish effectively who is playe one
            if (line.split('|')[2].toLowerCase() === this.user.toLowerCase()) {
                let NeedThis = lines[j].split('|')[1];
                return NeedThis;
            }
        }
        return '';
    }
    async Win(lines){
        for (let j = lines.length - 2; j >= 0; j--){ // -2 since last line is empty
            if (lines[j].split('|')[1] === 'win') {
                if (lines[j].split('|')[2].toLowerCase() === this.user.toLowerCase()) {
                    return true;
                    
                }
                return false;
            }
        }
        return false;
    }
};



