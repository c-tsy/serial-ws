namespace Ctsy {

    var serials: { [index: string]: Serial } = {};
    /**
     * 获得一个串口通信的实例
     * @param ws 
     */
    export function get_serial(ws: string) {
        if (serials[ws]) {
            return serials[ws]
        }
        return serials[ws] = new Serial(ws);
    }
    /**
     * 命令内容
     */
    export class Cmd {
        /**
         * 指令名称，
         * list 表示读取
         * send 表示发送，发送成功后并开始
         */
        Op: 'list' | 'send' | '' = '';
        /**
         * 指令类型，u表示上行，从页面发给串口服务
         */
        Type: 'd' | 'u' = 'u';
        /**
         * 串口名称
         */
        Name = ''
        /**
         * 波特率
         */
        Baud: number | 2400 | 9600 | 19200 = 2400
        /**
         * 模式
         * None,Odd,Even,Mark,Space
         */
        Parity: 'N' | 'O' | 'E' | 'M' | 'S' = 'N';
        /**
         * 数据内容，Hex模式
         */
        Data: string = ""
        /**
         * 超时时间,单位ms
         */
        Timeout = 1000
    }

    /**
     * 串口操作类
     */
    export class Serial {
        URL: string = ""
        WS?: WebSocket
        _ws: typeof WebSocket
        _ps: Cmd = new Cmd;
        _s?: Function
        _p?: Promise<any>
        constructor(url: string, ws: typeof WebSocket = WebSocket) {
            this.URL = url;
            this._ws = ws;
            // this.start();
        }
        /**
         * 
         */
        async start() {
            return new Promise((s, j) => {
                this.WS = new this._ws(this.URL)
                this.WS.onmessage = (d) => {
                    try {
                        if (this._s instanceof Function) {
                            this._s(JSON.parse(d.data))
                        }
                        this._p = undefined;
                    } catch (error) {

                    }
                }
                this.WS.onopen = () => {
                    s(true)
                }
                this.WS.onclose = (d) => {
                    setTimeout(() => {
                        s(this.start());
                    }, 1000)
                }
            })
        }


        /**
         * 列出串口
         */
        async list(): Promise<string[]> {
            if (!this.WS) {
                await this.start();
            }
            let p = new Cmd;
            p.Op = 'list'
            if (this.WS) {
                let rs = await this.send(p)
                return rs.Data.split(',')
            }

            return []
        }
        /**
         * 发送命令
         * @param {Cmd} Cmd 
         */
        send(Cmd: Cmd): Promise<Cmd> {
            this._p = new Promise(async (s, j) => {
                if (!this.WS) {
                    await this.start();
                }
                if (this._s) {
                    await this._p
                }
                this._s = s;
                if (!this.WS) {
                    await this.start();
                }
                if (this.WS) {
                    this.WS.send(JSON.stringify(Cmd))
                }
            })
            return this._p;
        }
    }
}

export default Ctsy;

// (async () => {
//     let s = new Ctsy.Serial("ws://localhost:9080/ws");
//     setTimeout(async () => {
//         let list = await s.list();
//         console.log(list)
//         let c = new Ctsy.Cmd()
//         c.Timeout = 10000;
//         c.Baud = 1200
//         c.Data = 'ff550103'.repeat(100) + '0a0b0c'
//         c.Op = 'send'
//         c.Name = list[list.length - 1]
//         let r = await s.send(c)
//         console.log(r.Data, r.Data == c.Data)
//     }, 1000);
// })()