import { Event2, Event3 } from '../../../Lib/Event'

const { ccclass, property } = cc._decorator

@ccclass
export default class TableView extends cc.Component {
    @property(cc.Prefab)
    itemTemplate: cc.Prefab = null
    @property(cc.ScrollView)
    scrollView: cc.ScrollView = null
    @property({ tooltip: '实际创建项数量' })
    spawnCount: number = 0
    @property({ tooltip: '间隔' })
    spacing: number = 0
    @property(cc.Size)
    itemSize: cc.Size = new cc.Size(0, 0)

    private content: cc.Node = null
    private totalCount: number = 100
    private data: any[] = []
    private items: cc.Node[] = []
    private updateTimer: number = 0
    private updateInterval: number = 0.2
    // 判定滚动方向
    private lastContentPosY: number = 0
    private bufferZone: number = 0

    evtTableViewInit = new Event2<number, cc.Node>(this)
    evtTableViewUpdate = new Event3<boolean, number, cc.Node>(this)

    // init<T>(data: T[], spawnCount: number) {
    //     this.data = data
    //     this.spawnCount = spawnCount
    //     this.updateUi()
    // }

    init<T>(totalCount: number, spawnCount: number) {
        this.totalCount = totalCount
        this.spawnCount = spawnCount
        this.updateUi()
    }

    updateUi() {
        // this.totalCount = this.data.length
        this.spawnCount =
            this.totalCount >= this.spawnCount
                ? this.spawnCount
                : this.totalCount
        this.content = this.scrollView.content
        this.content.removeAllChildren()
        this.items = []
        this.scrollView.stopAutoScroll()
        this.scrollView.scrollToTop()
        this.bufferZone =
            (this.spawnCount * (this.itemSize.height + this.spacing)) / 2

        this.initialize()
    }

    initialize() {
        this.content.height =
            this.totalCount * (this.itemSize.height + this.spacing) +
            this.spacing

        for (let i = 0; i < this.spawnCount; ++i) {
            let item = cc.instantiate(this.itemTemplate)
            item.setPosition(
                0,
                -item.height * (0.5 + i) - this.spacing * (i + 1)
            )

            this.evtTableViewInit.trigger(i, item)

            this.content.addChild(item)
            this.items.push(item)
        }
    }

    update(dt) {
        this.updateTimer += dt

        if (this.updateTimer < this.updateInterval) {
            return
        }

        this.updateTimer = 0
        let items = this.items
        let isDown = this.scrollView.content.y < this.lastContentPosY
        let offset = (this.itemSize.height + this.spacing) * items.length
        let newY = 0
        let len = items.length

        for (let i = 0; i < len; ++i) {
            let viewPos = this.getPositionInView(items[i])

            if (isDown) {
                newY = items[i].y + offset

                if (viewPos.y < -this.bufferZone && newY < 0) {
                    items[i].setPositionY(newY)
                    this.evtTableViewUpdate.trigger(isDown, len, items[i])
                }
            } else {
                newY = items[i].y - offset

                if (
                    viewPos.y > this.bufferZone &&
                    newY > -this.content.height
                ) {
                    items[i].setPositionY(newY)
                    this.evtTableViewUpdate.trigger(isDown, len, items[i])
                }
            }
        }

        this.lastContentPosY = this.scrollView.content.y
    }

    getPositionInView(item: cc.Node) {
        let worldPos = item.parent.convertToWorldSpaceAR(item.position)
        let viewPos = this.scrollView.node.convertToNodeSpaceAR(worldPos)
        return viewPos
    }
}
