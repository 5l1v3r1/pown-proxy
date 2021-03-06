const defaults = require('./defaults')

exports.yargs = {
    command: 'proxy [options] [command]',
    describe: 'HTTP proxy',

    builder: (yargs) => {
        const { hasNodeModule } = require('@pown/modules')

        yargs.options({
            log: {
                alias: 'l',
                type: 'boolean',
                default: false,
                describe: 'Log requests and responses'
            },

            host: {
                alias: 'h',
                type: 'string',
                default: '0.0.0.0',
                describe: 'Host to listen to'
            },

            port: {
                alias: 'p',
                type: 'number',
                default: 8080,
                describe: 'Port to listen to'
            },

            'ws-client': {
                alias: 'c',
                type: 'string',
                default: '',
                describe: 'Connect to web socket'
            },

            'ws-server': {
                alias: 's',
                type: 'boolean',
                default: false,
                describe: 'Forward on web socket'
            },

            'ws-host': {
                type: 'string',
                default: '0.0.0.0',
                describe: 'Web socket server host'
            },

            'ws-port': {
                type: 'number',
                default: 9090,
                describe: 'Web socket server port'
            },

            'ws-app': {
                type: 'string',
                default: '',
                choices: ['', 'httpview'],
                describe: 'Open app'
            },

            'certs-dir': {
                type: 'string',
                default: defaults.certsDir,
                describe: 'Directory for the certificates'
            },

            'server-key-length': {
                type: 'number',
                default: defaults.serverKeyLength,
                describe: 'Default key length for certificates'
            },

            'default-ca-common-name': {
                type: 'string',
                default: defaults.defaultCaCommonName,
                describe: 'The CA common name'
            }
        })

        if (hasNodeModule('@pown/blessed')) {
            yargs.options('blessed', {
                type: 'boolean',
                describe: 'Start with blessed ui',
                alias: 'b',
                default: false
            })
        }
    },

    handler: (argv) => {
        const mkdirp = require('mkdirp')
        const EventsEmitter = require('events')
        const { Logger } = require('@pown/cli/lib/logger')

        const logger = new Logger(argv)

        const { Proxy } = require('./proxy')

        mkdirp.sync(argv['certs-dir'])

        let proxy

        if (argv['ws-client']) {
            proxy = new EventsEmitter()
        }
        else {
            proxy = new Proxy({ certsDir: argv['certs-dir'], serverKeyLength: argv['server-key-length'], defaultCaCommonName: argv['default-ca-common-name'] })

            proxy.listen(argv.port, () => {
                const address = proxy.server.address()

                logger.info(`proxy listening on ${address.address}:${address.port}`)
            })
        }

        if (argv.log) {
            proxy.on('beep', (transaction) => {
                logger.info(`${transaction.method} ${transaction.uri} ${transaction.responseCode} ${transaction.responseMessage}`)
            })
        }

        if (argv.blessed) {
            require('./blessed').handler(argv, proxy)
        }

        if (argv['ws-client']) {
            require('./ws/client').handler(argv, proxy)
        }
        else
        if (argv['ws-server']) {
            require('./ws/server').handler(argv, proxy)
        }
    }
}
