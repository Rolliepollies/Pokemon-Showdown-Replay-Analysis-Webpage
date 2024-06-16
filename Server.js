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
//let Account;


const requestListener = function (req, res) {
    let Account;
    if (req.method === 'POST' && req.url === '/submit') {
        user = '';
        req.on('data', chunk => {
            user += chunk.toString();
        });
        user = user.replace('User=','');
        req.on('end', async () => {
            console.log(user);
            account = new Profile(user);
            let amount = await account.getReplaysArray();
            //await account.Winrate(account.replays, 'none', 'none');
            //await account.Winrate(account.replays, 'twenty100', 'user');
            // await account.Winrate(account.replays, 'vigoroth', 'poke');
            //await account.Winrate(account.replays, 'knockoff', 'move');
            await account.Winrate(account.replays, '[Gen 9] Random Battle', 'format');
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
    else if(req.method === 'POST' && req.url === '/mod') {
        let change = '';
        req.on('data', chunk => {
            change += chunk.toString();
        });
        
        req.on('end', async () => {
            console.log('change' + change);
            let params = change.split('&');
            let AType = params[0].replace('Analysis=','');
            let MType = params[1].replace('ModType=','');
            let Mod = params[2].replace('Mod=','');
            console.log(AType);
            console.log(MType);
            console.log(Mod);
            switch(AType){
                case 'Winrate':
                    await Account.Winrate(account.replays, Mod, MType);
                    break;
                case 'Usage':
                    
                    break;
                case 'Rng':
                    break;
            }
            
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
        console.log('array in length: ' + array.length);
        let wins = 0;
        let valid = 0;
        let data = '';
        let whichPlayer = '';
        let contains = true;
        switch(Mtype){//ealry exitr for move poke and type
            case 'none':
                break;
            case 'format':
                break;
            case 'user':
                break;
            case 'poke':
                if (!this.existsPoke(mod)){
                    console.log('This pokemon does not exist');
                    return;
                }
                break;
            case 'move':
                if(!this.existsMove(mod)){
                    console.log('This move does not exist');
                    return;
                }
                break;
            /*case 'type':
                if(!this.existsType(mod)){
                    console.log('This type does not exist');
                    return;
                }
                break;*/
        }

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
                    if (await this.Win(lines)) {
                        wins++;
                    }
                    valid++;
                    break;
                case 'format'://check
                    contains = false;
                    for (let j = 0; j < 25; j++) {
                        if (lines[j].split('|')[1] === 'tier') {
                            if (lines[j].split('|')[2].toLowerCase() === mod.toLowerCase()) {
                                contains = true;
                                break;
                            }
                        }
                    }
                    if (contains) {
                        valid++;
                        if (await this.Win(lines)) {
                            wins++;
                        }
                    }
                case 'user'://done
                    for (let j = 0; j < lines.length; j++) {
                        if (lines[j].split('|')[1] === 'player') {
                            if (mod.toLowerCase() !== lines[j].split('|')[3].toLowerCase()) {
                                if (lines[j + 1].split('|')[3].toLowerCase() !== mod.toLowerCase()) {
                                    
                                    contains = false;
                                    break;
                                }
                            }

                            break;
                        }
                    }
                    if (contains) {
                        valid++;
                        if (await this.Win(lines)) {
                            wins++; 
                        }
                    }
                    contains = true;
                    break;

                case 'poke'://done
                    let pokemon = '';
                    whichPlayer = await this.findPlayer(lines);
                    //console.log(whichPlayer);
                    contains = false;
                    for (let j = 0; j < lines.length; j++) {
                        
                        if (lines[j].split('|')[1] === 'switch') {
                            if (whichPlayer === lines[j].split('|')[2].split('a')[0]) {
                                let pok = lines[j].split('|')[2].split(':')[1].toLowerCase().replace(/\s/g, '');
                                if (pok === mod.toLowerCase()) {
                                    contains = true;
                                    break;
                                }
                                for (let k = 0; k < 6; k++) {
                                    if(pok === pokemon.split(' ')[k]){//inside pokemon string names are separated by spaces
                                        break;
                                    }
                                    if(k === 5){
                                        pokemon += pok + ' ';
                                    }
                                }   
                                if(pokemon.split(' ').length >= 6){//exits early if all pokemon are checked
                                    break;
                                }

                            }
                        }
                    }
                    if (contains) {
                        valid++;
                        if (await this.Win(lines)) {
                            wins++;
                        }
                    }
                    break;

                case 'move'://done
                    whichPlayer = await this.findPlayer(lines);
                    contains = false;
                    for(let j = 0; j < lines.length; j++){
                        if(lines[j].split('|')[1] === 'move'){
                            if(whichPlayer === lines[j].split('|')[2].split('a')[0]){
                                if(lines[j].split('|')[3].toLowerCase().replace(/\s/g, '') === mod.toLowerCase()){
                                    contains = true;
                                    break;
                                }
                            }
                        }
                    }
                    if(contains){
                        valid++;
                        if(await this.Win(lines)){
                            wins++;
                        }
                    }
                    break;
            }
        }
        console.log('you won this many times: ' + wins + ' out of ' + valid);
    }

    async existsPoke(poke){
        fs.readFile(__dirname + "/PokData.txt", "utf8")
            .then(contents => {
                let check = contents.split('\n');
                for (let k = 0; k < check.length; k++) {
                    if (poke.toLowerCase() === check[k].split('\t')[0].toLowerCase()) {
                        return true;
                    }
                }
                return false;
            })
            .catch(err => {
                console.error(`Could not read index.html file: ${err}`);
                process.exit(1);
            });
    }
    async existsMove(move){
        fs.readFile(__dirname + "/moves.txt", "utf8")
            .then(contents => {
                let check = contents.split('\n');
                for (let k = 0; k < check.length; k++) {
                    if (move.replace(/\s/g, '').toLowerCase() === check[k]) {
                        
                        return true;

                    }
                }
                return false;
            })
            .catch(err => {
                console.error(`Could not read file: ${err}`);
                process.exit(1);
            });
        
    }

    async existsType(type){
        fs.readFile(__dirname + "/moves.ts", "utf8")
            .then(contents => {
                let check = contents.split('\n');
                for (let k = 0; k < check.length; k++) {
                    if (type.toLowerCase() === check[k].split('\t')[0].toLowerCase()) {
                        return true;
                    }
                }
                return false;
            })
            .catch(err => {
                console.error(`Could not read file: ${err}`);
                process.exit(1);
            });
        
    }
    async findPlayer(array){
        for (let j = 0; j < 25; j++) {//25 is arbitray but should be enough to find player and accont for spectators joining
            if (array[j].split('|')[1] === 'player') { //need to establish effectively who is playe one
                if (array[j].split('|')[3].toLowerCase() === this.user.toLowerCase()) {
                    return 'p1';
                }
                return 'p2';
            }
        }
        console.log('Error in finding player');
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


