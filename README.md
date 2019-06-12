# react-quill-image-uploader

a plugin for react-quill which can upload multi image and remember the image url histroy

![screenshot](./screenshot.jpg)

- click or drag an image into "click or drag" area, then plugin will call uploadCallback and wait for the promise
- plugin will remember the image url which is saved
- click the image preview, the plugin will insert the image(width=100%) into the editor
- drag the toolbar of the plugin and move where you want

# how to install

```javascript
npm i react-quill-image-uploader
// yarn add react-quill-image-uploader
```

# how to use

demo: ./demo/index.html [Demo](./demo/index.html "Demo")

```javascript
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import ReactQuillImageUploader, {
  saveImageSrc
} from "react-quill-image-uploader"

class App extends React.Component {
  modules = {
    toolbar: {
      container: [["bold", "italic", "underline", "strike"], ["image"]],
      handlers: {
        image: () => {
          const { clientX, y: clientY } = window.event
          const position = { x: clientX, y: clientY } // position the plugin to show
          this.ReactQuillImageUploaderRef &&
            this.ReactQuillImageUploaderRef.toggle(position) // show or hide the plugin
        }
      }
    }
  }
  componentDidMount() {
    this.quill = this.quillRef && this.quillRef.getEditor()
    this.setState({ quill: this.quill })
    // import {saveImageSrc} from 'react-quill-image-uploader', call saveImageSrc('https://iph.href.lu/100x100')
    // or
    // from version 0.0.1
    // ReactQuillImageUploader.saveImageSrc("https://iph.href.lu/100x100")
    // from version 0.0.4
    ReactQuillImageUploader.saveImage({
      name: "demo.jpg",
      src: "https://iph.href.lu/100x100"
    })
  }

  uploadImageCallBack = async (file, base64) => {
    // submit file to server
    let src = "https://iph.href.lu/200x200" // demo image src
    if (base64) {
      src = base64
    }
    // insertImg by hand
    this.ReactQuillImageUploaderRef &&
      this.ReactQuillImageUploaderRef.insertImg(src)

    return Promise.resolve({
      data: {
        name: file.name || "",
        link: src
      }
    })
  }
  render() {
    const { modules, className = "", placeholder = "write here.." } = this.props
    const { quill = {} } = this.state
    return (
      <div>
        <ReactQuill
          ref={el => {
            this.quillRef = el
          }}
          placeholder={placeholder}
          modules={modules || this.modules}
          className={className}
        />
        <ReactQuillImageUploader
          ref={el => {
            this.ReactQuillImageUploaderRef = el
          }}
          quill={this.state.quill}
          uploadCallback={uploadImageCallBack}
        />
      </div>
    )
  }
}
```

### api

- insertImg(imgSrc, width = "100%", source = "user") // insert img into editor at last editor selection index. [quill more info](https://quilljs.com/docs/api/#insertembed)
- saveImage({name,src}) // save name and src into localStorage
- saveImageSrc(src) // save src into localStorage
- toggle({x=0,y=0}) // show or hide at browser somewhere
- uploadCallback // return promise {data: {name,link}}

### history

- 20190612,v0.0.6 support to insert image by base64, modify image preview ui.
- 20190612,v0.0.5 fix bug for public method `saveImage`, add public method `insertImg` for inserting img by hand。
- 20190611,v0.0.4 add new upload type, upload by insert image src。
- 20190611,v0.0.3 update to new UI, insert image without focus on editor。
