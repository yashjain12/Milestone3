import React, { Component } from 'react';
import Papa from "papaparse";

class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      jsonData: null,
    };
  }

  handleFileSubmit = (event) => {
    event.preventDefault();
    const { file } = this.state;

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const json = this.csvToJson(text);
        const headers = this.getHeaders(text);
        console.log('headers', headers)
        this.props.onFileUpload(json, headers);
      };
      reader.readAsText(file);
    }
  };
  csvToJson = (csv) => {
    const parsed = Papa.parse(csv, {header: true, skipEmptyLines: true, dynamicTyping: true,})
    /*const filteredData = parsed.data.filter((row) =>
      Object.values(row).every((value) => value !== null && value !== undefined && !isNaN(value))
    ); */

    const columnsToCheck = ['Rank', 'Votes', 'Rating', 'Revenue (Millions)'];
    const filteredData = parsed.data.filter((row) =>
      columnsToCheck.every((col) => row[col] !== null && row[col] !== undefined && !isNaN(row[col]))
    );
    
    return filteredData;
  };

  getHeaders = (csv) => {
    const lines = csv.split("\n");
    return lines[0].split(",").map((header) => header.trim());
  };

  render() {
    return (
      <div style={{ marginBottom: 100, backgroundColor: "#f0f0f0", paddingBottom: 50, paddingRight: 100, paddingLeft: 100 }}>
        <h2>Upload a CSV File</h2>
        <form onSubmit={this.handleFileSubmit} style={{ display: 'flex' }}>
          <input type="file" accept=".csv" onChange={(event) => this.setState({ file: event.target.files[0] })} />
          <button type="submit">Upload</button>
        </form>
      </div>
    );
  }
}

export default FileUpload;
