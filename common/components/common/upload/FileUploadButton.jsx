// @flow

import React from 'react';

type FileUploadData = {|
  key: string,
  publicUrl: string
|};

type Props = {|
  onFileUpload: (FileUploadData) => null,
  buttonText: string,
  acceptedFileTypes: string
|};

type State = {|
  s3Key: string,
|};

class FileUploadButton extends React.PureComponent<Props, State> {
  
  constructor(): void {
    super();
    this.state = {
      s3Key: undefined
    };
  }
  
  render(): React$Node {
    return (
      <div>
        <input type="button" value={this.props.buttonText} onClick={this._handleClick.bind(this)} />
        <input ref="fileInput" type="file" style={{display:"none"}} accept={this.props.acceptedFileTypes} onChange={this._handleFileSelection.bind(this)} />
      </div>
    );
  }
  
  _handleClick() {
    this.refs.fileInput.click();
  }
  
  _handleFileSelection() {
    this.launchPresignedUploadToS3(this.refs.fileInput.files[0]);
  }
  
  launchPresignedUploadToS3(file){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/presign_s3/upload/project/thumbnail?file_type=" + file.type);
    var instance = this;
    
    xhr.onreadystatechange = function(){
      if(xhr.readyState === 4){
        if(xhr.status === 200){
          var response = JSON.parse(xhr.responseText);
          instance.uploadFileToS3(file, response.data, response.url);
        }
        else{
          alert("Could not get signed URL.");
        }
      }
    };
    xhr.send();
  }
  
  uploadFileToS3(file, s3Data, url){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", s3Data.url);
    
    var postData = new FormData();
    for(var key in s3Data.fields){
      postData.append(key, s3Data.fields[key]);
    }
    postData.append('file', file);
    this.state.s3Key = s3Data.fields.key;
    var instance = this;
    
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4){
        if(xhr.status === 200 || xhr.status === 204){
          var fileUploadData = {
            key: instance.state.s3Key,
            publicUrl: url
          };
          instance.props.onFileUpload(fileUploadData);
        }
        else{
          alert("Could not upload file.");
        }
      }
    };
    xhr.send(postData);
  }
  
}

export default FileUploadButton;