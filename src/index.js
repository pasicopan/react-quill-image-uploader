import React from "react"
import style from "./style.less"

const LOCALSTORAGENAME = "editorUploadImageHistory"
const LOCALSTORAGEDEFAULTVALUE = '{"list":[]}'
const originPosition = { x: 50, y: -100 }
let reactQuillImageUploader = null

function getDataFromLocalstorage() {
  const dataJSONString =
    localStorage.getItem(LOCALSTORAGENAME) || LOCALSTORAGEDEFAULTVALUE
  let data = { list: [] }
  try {
    data = JSON.parse(dataJSONString)
  } catch (err) {
    console.log(err)
  }
  return data
}

function saveImageSrc({ name, src }) {
  const data = getDataFromLocalstorage()
  if (data.list.some(d => d.src === src)) return
  data.list.unshift({ name, src })

  try {
    localStorage.setItem(LOCALSTORAGENAME, JSON.stringify(data))
    reactQuillImageUploader && reactQuillImageUploader.updataList()
  } catch (err) {
    console.log(err)
    localStorage.setItem(LOCALSTORAGENAME, LOCALSTORAGEDEFAULTVALUE)
  }
}
function removeImageSrc(imgSrc) {
  const data = getDataFromLocalstorage()
  data.list = data.list.filter(d => d.src !== imgSrc)
  try {
    localStorage.setItem(LOCALSTORAGENAME, JSON.stringify(data))
  } catch (err) {
    console.log(err)
    localStorage.setItem(LOCALSTORAGENAME, LOCALSTORAGEDEFAULTVALUE)
  }
}
/**
 * ReactQuillImageUploader
 */
export default class ReactQuillImageUploader extends React.Component {
  isDrag = false
  componentPosition = Object.assign({}, originPosition)
  state = {
    editorSelectionIndex: 0,
    hasAddEvent: false,
    style: style,
    uploading: false,
    isShowDialog: false,
    isFixed: false,
    list: [],
    componentPositionStyle: {
      left: `${originPosition.x}px`,
      top: `${originPosition.y}px`,
    },
  }
  static saveImageSrc = saveImageSrc
  componentWillReceiveProps(props) {
    this.addEvent(props)
  }
  componentWillMount() {
    this.addEvent(this.props)
    reactQuillImageUploader = this
    this.isShowDialog = this.state.isShowDialog
    document.body.addEventListener("mousemove", this.componentMouseMove)
    document.body.addEventListener("mouseup", this.componentMouseUp)
    this.updataList()
  }
  componentWillUnmount() {
    this.removeEvent()
    document.body.removeEventListener("mousemove", this.componentMouseMove)
    document.body.removeEventListener("mouseup", this.componentMouseUp)
  }
  addEvent = props => {
    const { quill } = props
    if (!quill.on || this.state.hasAddEvent) return
    this.setState({ hasAddEvent: true })
    quill.on("selection-change", this.selectionChange)
  }
  selectionChange = range => {
    if (range) {
      this.setState({ editorSelectionIndex: range.index })
    }
  }
  removeEvent = () => {
    const { quill } = this.props
    quill.off("selection-change", this.selectionChange)
  }
  updataList = () => {
    const data = getDataFromLocalstorage()
    this.setState({ list: data.list })
  }
  deleteImg = (event, imgSrc) => {
    event.stopPropagation()
    event.preventDefault()
    const list = this.state.list.filter(img => imgSrc !== img.src)
    this.setState({ list })
    removeImageSrc(imgSrc)
  }
  insertImg = (event, imgSrc, width = "100%") => {
    event.stopPropagation()
    event.preventDefault()
    const { quill } = this.props
    const index = this.state.editorSelectionIndex
    quill.insertEmbed(index, "image", imgSrc, "user")
    quill.formatText(index, index + 1, "width", width)
    quill.setSelection(index + 1)
  }
  hideDialog = () => {
    this.isShowDialog = false
    this.setState({
      isShowDialog: this.isShowDialog,
    })
  }
  showDialog = () => {
    this.isShowDialog = true
    this.setState({
      isShowDialog: this.isShowDialog,
    })
  }
  toggle = ({ x = 0, y = 0 }) => {
    if (this.isShowDialog) {
      this.updataList()
    }
    this.isShowDialog = !this.isShowDialog
    let left = (this.componentPosition.x = x + originPosition.x)
    let top = (this.componentPosition.y = y + originPosition.y)

    if (left < 0) {
      left = 0
    }
    if (top < 0) {
      top = 0
    }
    this.componentPosition.x = left
    this.componentPosition.y = top
    this.setState({
      isShowDialog: this.isShowDialog,
      componentPositionStyle: {
        left: `${left}px`,
        top: `${top}px`,
      },
    })
  }
  getFiles = e => {
    const { uploadCallback } = this.props
    if (e.target.files && e.target.files.length > 0) {
      this.setState({ uploading: true })
    }
    let finished = 0
    const promiseList = []
    const len = e.target.files.length
    console.log("e.target.files=", e.target.files)
    for (let i = 0; i < len; i++) {
      promiseList.push(uploadCallback(e.target.files[i]))
    }
    Promise.all(promiseList).then(dataList => {
      dataList.forEach(data => {
        if (data.data.link) {
          saveImageSrc(data.data)
        }
        finished++
        if (finished === len) {
          this.setState({ uploading: false })
        }
      })
    })
  }
  componentMouseDown = e => {
    e.preventDefault()
    this.isDrag = true
    this.componentPosition.sx = e.clientX
    this.componentPosition.sy = e.clientY
  }
  componentMouseMove = e => {
    if (!this.isDrag) return
    e.preventDefault()

    this.componentPosition.mx = e.clientX - this.componentPosition.sx
    this.componentPosition.my = e.clientY - this.componentPosition.sy
    let left = this.componentPosition.mx + this.componentPosition.x
    let top = this.componentPosition.my + this.componentPosition.y
    if (left < 0) {
      left = 0
    }
    if (top < 0) {
      top = 0
    }
    const componentPositionStyle = {
      left: `${left}px`,
      top: `${top}px`,
    }
    this.setState({
      componentPositionStyle,
    })
  }
  componentMouseUp = e => {
    e.preventDefault()
    if (this.isDrag) {
      this.isDrag = false
      this.componentPosition.x += this.componentPosition.mx || 0
      this.componentPosition.y += this.componentPosition.my || 0
    }
  }
  resetComponentPosition = () => {
    this.componentPosition = Object.assign({}, originPosition)
    this.setState({
      componentPositionStyle: {
        left: `${this.componentPosition.x}px`,
        top: `${this.componentPosition.y}px`,
      },
    })
  }
  handleInputChange = e => {
    this.setState({
      isFixed: e.target.checked,
    })
    if (!e.target.checked) {
      this.resetComponentPosition()
    }
  }

  render() {
    const { uploading } = this.state
    return (
      <div className={style.toolBarButton}>
        {this.state.isShowDialog && (
          <div
            className={style.imageListContainer}
            style={this.state.componentPositionStyle}
          >
            <div className={style.toolbar}>
              <div
                className={style.dragArea}
                onMouseDown={this.componentMouseDown}
              />
              <div className={style.closeBtn} onClick={this.hideDialog}>
                X
              </div>
            </div>
            <div className={style.uploadInputContainer}>
              <div className={style.uploadInputLabelContainer}>
                {!uploading && (
                  <p className={style.uploadInputLabel}>click or drag</p>
                )}
                {uploading && (
                  <p className={style.uploadInputLabel}>uploading...</p>
                )}
              </div>
              {!uploading && (
                <input
                  ref={""}
                  className={style.uploadInput}
                  type="file"
                  accept="image/gif,image/jpeg,image/jpg,image/png,image/svg"
                  multiple
                  onChange={this.getFiles}
                />
              )}
            </div>
            {this.state.list.length > 0 && (
              <p className={style.historyTitle}>upload history</p>
            )}
            <div className={style.imageList}>
              {this.state.list.map((img, key) => {
                return (
                  <div
                    key={`imageListItem_key_${key}`}
                    className={style.imageListItem}
                  >
                    <div className={style.imageListImgCon}>
                      <img src={img.src} className={style.imageListImg} />
                    </div>
                    <div className={style.content}>
                      <p title={img.name} className={style.imgName}>
                        {img.name}
                      </p>
                      <div className={style.btns}>
                        <div
                          className={style.insertBtn}
                          onClick={e => {
                            this.insertImg(e, img.src)
                          }}
                        >
                          insert
                        </div>
                        <div
                          className={style.deleteBtn}
                          onClick={e => {
                            this.deleteImg(e, img.src)
                          }}
                        >
                          delete
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
}

export { saveImageSrc, removeImageSrc }
