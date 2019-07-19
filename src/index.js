import React from "react"
import style from "./style.less"

const LOCALSTORAGENAME = "EDITORUPLOADIMAGEHISTORY"
const LOCALSTORAGEDEFAULTVALUE = '{"list":[]}'
const originPosition = { x: 50, y: -100 }
let reactQuillImageUploader = null

function getDataFromLocalstorage() {
  const dataJSONString =
    localStorage.getItem(LOCALSTORAGENAME) || LOCALSTORAGEDEFAULTVALUE
  let data = { list: [] }
  try {
    data = JSON.parse(dataJSONString)
    if (!data || !data.list || !data.list.some) {
      throw new Error('LOCALSTORAGE FORMAT ERROR')
    }
  } catch (err) {
    localStorage.setItem(LOCALSTORAGENAME, LOCALSTORAGEDEFAULTVALUE)
    console.warn(err, 'reset LOCALSTORAGE')
  }
  return data
}

function getHistory() {
  const data = getDataFromLocalstorage()
  return data.list
}
function setHistory(list) {
  const valList = []
  try {
    list.forEach(el => {
      const { name, src } = el
      if (!name || typeof name !== "string" || !src || typeof src !== "string") {
        throw new Error('setHistory PARAM ERROR')
      }
      valList.push({ name, src })
    });
  } catch (err) {
    console.warn("make sure the args of setHistory is [{name:'',src:''}]")
    // console.error(err)
    return false
  }

  try {
    localStorage.setItem(LOCALSTORAGENAME, JSON.stringify({ valList }))
    reactQuillImageUploader && reactQuillImageUploader.updataList()
    return true
  } catch (err) {
    console.warn("May be your browser localStorage is full. Please delete some old image and retry.")
    console.error(msg)
    return false
  }
}
function removeHistory() {
  return setHistory([])
}

function saveImage(config) {
  const { name, src, status } = config
  const data = getDataFromLocalstorage()
  if (data.list.some(d => src === d.src)) return
  data.list.unshift({ name, src, status })

  try {
    localStorage.setItem(LOCALSTORAGENAME, JSON.stringify(data))
    reactQuillImageUploader && reactQuillImageUploader.updataList()
  } catch (err) {
    const msg =
      "May be your browser localStorage is full. Please delete some old image and retry."
    console.error(msg + ", error=" + err)
    // alert(msg)
    // localStorage.setItem(LOCALSTORAGENAME, LOCALSTORAGEDEFAULTVALUE)
  }
}
function getBase64(file) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = function () {
      // console.log(reader.result)
      resolve(reader.result)
    }
    reader.onerror = function (error) {
      console.log("Error: ", error)
      reject(error)
    }
  })
}
/**
 * saveImageSrc
 * for version <=0.0.2
 * @date 2019-06-11
 * @param {*} { name, src }
 */
function saveImageSrc(src) {
  saveImage({ name: "", src })
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
  processing = 0
  componentPosition = Object.assign({}, originPosition)
  state = {
    processing:0,
    uploadFailList: [],
    isShowHistory: true,
    isShowUploadFail: true,
    title: "",
    urlName: "",
    urlLink: "",
    uploadType: "file",
    editorSelectionIndex: 0,
    isBase64: false,
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
  static saveImage = saveImage
  static getHistory = getHistory
  static setHistory = setHistory
  static removeHistory = removeHistory

  componentWillReceiveProps(props) {
    this.init(props)
  }
  componentWillMount() {
    this.init(this.props)
    reactQuillImageUploader = this
    this.isShowDialog = this.state.isShowDialog
    document.body.addEventListener("mousemove", this.componentMouseMove)
    document.body.addEventListener("mouseup", this.componentMouseUp)
    this.updataList()
  }
  init = (props) => {
    this.addEvent(props)
    const { isShowUploadFail = true, isShowHistory = true } = props
    this.setState({ isShowUploadFail, isShowHistory })
  }
  componentWillUnmount() {
    this.removeEvent()
  }
  addEvent = props => {
    const { quill } = props
    if (!quill) return
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
    document.body.removeEventListener("mousemove", this.componentMouseMove)
    document.body.removeEventListener("mouseup", this.componentMouseUp)
  }
  updataList = () => {
    const data = getDataFromLocalstorage()
    this.setState({ list: data.list })
  }
  deleteImg = imgSrc => {
    const list = this.state.list.filter(img => imgSrc !== img.src)
    this.setState({ list })
    removeImageSrc(imgSrc)
  }

  deleteReUpload = file => {
    this.setState({ uploadFailList: this.state.uploadFailList.filter(f => f !== file) })
  }
  reUploadImg = file => {
    this.deleteReUpload(file)
    this.upload([file])
  }
  insertImg = (imgSrc, width = "100%", source = "user") => {
    const { quill } = this.props
    const index = this.state.editorSelectionIndex
    quill.insertEmbed(index, "image", imgSrc, source)
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
  toggle = (config) => {
    const { title = '', x = window.event.x, y = window.event.y } = config
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
      title,
      isShowDialog: this.isShowDialog,
      componentPositionStyle: {
        left: `${left}px`,
        top: `${top}px`,
      },
    })
  }
  getFiles = e => {
    if (e.target.files && e.target.files.length > 0) {
      this.upload(e.target.files)
    }
  }
  upload = files => {
    const { uploadCallback } = this.props
    if (files && files.length > 0) {
      this.setState({ uploading: true })
    }
    this.processing = this.processing + files.length
    this.setState({ processing: this.processing})
    const promiseList = []
    const len = files.length
    for (let i = 0; i < len; i++) {
      const f = files[i]
      if (this.state.isBase64) {
        promiseList.push(
          getBase64(f).then(base64 => {
            return uploadCallback(f, base64).then((data) => [data, f]).catch(() => [null, f])
          })
        )
      } else {
        promiseList.push(uploadCallback(f).then((data) => [data, f]).catch(() => [null, f]))
      }
    }
    Promise.all(promiseList).then(dataList => {
      const uploadFailList = []

      dataList.forEach(dataFileList => {
        const [data, file] = dataFileList
        if (!data || data.status === 'fail') {
          uploadFailList.push(file)
        } else if (data && data.data.link) {
          saveImage({ name: data.data.name, src: data.data.link, status: data.status })
        }
        this.processing--
        this.setState({ processing: this.processing })
        if (this.processing === 0) {
          this.setState({ uploading: false })
        }
      })
      this.setState({
        uploadFailList: this.state.uploadFailList.concat(uploadFailList),
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
  onChangeUploadType = e => {
    // console.log("onChangeUploadType,e=", e, e.currentTarget.value)
    this.setState({ uploadType: e.currentTarget.value })
  }
  handleSubmitURL = () => {
    const { urlName: name, urlLink: src } = this.state
    saveImage({ name, src })
  }
  handleChangeUrlName = e => {
    this.setState({
      urlName: e.target.value,
    })
  }
  handleChangeUrlLink = e => {
    this.setState({
      urlLink: e.target.value,
    })
  }
  onChangeIsBase64 = e => {
    this.setState({
      isBase64: e.target.checked,
    })
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
              >
                {this.state.title}
              </div>
              <div className={style.closeBtn} onClick={this.hideDialog}>
                X
              </div>
            </div>
            {/* upload by file */}
            {this.state.uploadType === "file" && (
              <div className={style.uploadInputContainer}>
                <div className={style.uploadInputLabelContainer}>
                  {!uploading && (
                    <p className={style.uploadInputLabel}>click or drag</p>
                  )}
                  {uploading && (
                    <p className={style.uploadInputLabel}>uploading {this.state.processing} file</p>
                  )}
                </div>
                {(
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
            )}
            {/* upload by url */}
            {this.state.uploadType === "url" && (
              <div className={style.urlform}>
                <div className={style.urlItem}>
                  <label className={style.urlLabel}>name: </label>
                  <input
                    className={style.urlInput}
                    type="text"
                    value={this.state.urlName}
                    onChange={this.handleChangeUrlName}
                  />
                </div>
                <div className={style.urlItem}>
                  <label className={style.urlLabel}>url: </label>
                  <input
                    className={style.urlInput}
                    type="text"
                    value={this.state.urlLink}
                    onChange={this.handleChangeUrlLink}
                  />
                </div>
                <div className={style.submitBtnCon}>
                  <button onClick={this.handleSubmitURL}>submit</button>
                </div>
              </div>
            )}
            <div className={style.uploadTypeBar}>
              <div className={style.uploadType}>
                <input
                  type="radio"
                  name="uploadType"
                  value="file"
                  checked={this.state.uploadType === "file"}
                  onChange={this.onChangeUploadType}
                />
                <span>File</span>
                <input
                  type="radio"
                  name="uploadType"
                  value="url"
                  checked={this.state.uploadType === "url"}
                  onChange={this.onChangeUploadType}
                />
                <span>URL</span>
              </div>
              {this.state.uploadType === "file" && (
                <div className={style.uploadTypeExt}>
                  <input
                    type="checkbox"
                    name="base64"
                    value={"base64"}
                    checked={this.state.isBase64}
                    onChange={this.onChangeIsBase64}
                  />
                  <span>base64</span>
                </div>
              )}
            </div>
            {this.state.uploadFailList.length > 0 && this.state.isShowUploadFail && (
              <p className={style.historyTitle}>upload fail {this.state.uploadFailList.length}</p>
            )}
            <div className={style.imageList}>
              {this.state.isShowUploadFail && this.state.uploadFailList.map((file, key) => {
                return (<HistoryItem title={file.name} key={key} file={file} reUploadImg={this.reUploadImg.bind(this)} deleteReUpload={this.deleteReUpload.bind(this)} />)
              })}
            </div>
            {this.state.list.length > 0 && this.state.isShowHistory && (
              <p className={style.historyTitle}>upload history {this.state.list.length}</p>
            )}
            <div className={style.imageList}>
              {this.state.isShowHistory && this.state.list.map((img, key) => {
                return (<HistoryItem title={img.name} key={key} src={img.src} insertImg={this.insertImg.bind(this)} deleteImg={this.deleteImg.bind(this)} />)
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
}

function HistoryItem(props) {
  const { title, src, insertImg, deleteImg, reUploadImg, deleteReUpload, file } = props
  return (
    <div
      className={style.imageListItem}
    >
      <div className={style.imageListImgCon}>
        <img src={src} className={style.imageListImg} />
      </div>
      {file && <div className={style.content}>
        <p
          title={title}
          className={[style.imgName, style.imgFail].join(' ')}
        >
          {title}
        </p>
        <div className={style.btns}>
          <div
            className={style.reUploadBtn}
            onClick={() => {
              reUploadImg(file)
            }}
          >
            upload
          </div>
          <div
            className={style.reUploadBtn}
            onClick={() => {
              deleteReUpload(file)
            }}
          >
            delete
          </div>
        </div>
      </div>}
      {!file && <div className={style.content}>
        <p
          title={title}
          className={style.imgName}
        >
          {title}
        </p>
        <div className={style.btns}>
          <div
            className={style.insertBtn}
            onClick={() => {
              insertImg(src)
            }}
          >
            insert
            </div>
          <div
            className={style.deleteBtn}
            onClick={() => {
              deleteImg(src)
            }}
          >
            delete
          </div>
        </div>
      </div>}
    </div>)
}

export { saveImage, saveImageSrc, removeImageSrc, getHistory, setHistory, removeHistory }
