# fishfolio

[Nobackend](http://nobackend.org/) portfolio platform for open source web developers based on [Angular.JS](https://angularjs.org/) and [Firebase](http://firebase.com/).

---

## Development

### Development dependencies

 - node & npm
 - grunt-cli
 - bower

```
$ sudo npm install -g grunt-cli bower
```

### Initial setup

Clone app:

```
$ git clone https://github.com/aparabolica/fishfolio.git
$ cd fishfolio/
```

Copy `config.example.json` to `config.json` and set your variables.

### Install app

```
$ mkdir -p dist/ && npm install
```

### Build or watch changes

Watch with LiveReload enabled

```
$ grunt watch
```

Build with minified javascript

```
$ grunt build
```

### Initialize server

```
$ cd dist/
$ python -m SimpleHTTPServer
```

Server will be available at http://localhost:8000/

## Deploy to gh-pages

Fork the repository to enable automatic deploy to you gh-pages branch.

```
$ grunt deploy
```
