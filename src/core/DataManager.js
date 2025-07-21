export default class DataManager {
  constructor(table, data = []) {
    this.table = table;
    this.originalData = data;   // full data set
    this.filteredData = [...data];  // filtered data
    this.pageSize = (table.options.pagination && table.options.pagination.pageSize) || 10;
  }

  getData() {
    return this.filteredData;
  }

  setData(data) {
    this.originalData = data;
    this.filteredData = [...data];
  }

  applyFilter(criteria) {
    // Jednostavno filtriranje: gleda samo prvi key u criteria
    const key = Object.keys(criteria)[0];
    const value = criteria[key].toLowerCase();

    this.filteredData = this.originalData.filter(item =>
      (item[key] + '').toLowerCase().includes(value)
    );
  }

  getPageData(page = 1) {
    const start = (page - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }
}