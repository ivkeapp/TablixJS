export default class Renderer {
  constructor(table) {
    this.table = table;
  }

  renderTable(data) {
    const columns = this.table.options.columns || [];

    let html = '<table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse:collapse;">';

    // Header
    html += '<thead><tr>';
    columns.forEach(col => {
      html += `<th>${col.title || col.name}</th>`;
    });
    html += '</tr></thead>';

    // Body
    html += '<tbody>';
    data.forEach(row => {
      html += '<tr>';
      columns.forEach(col => {
        // Ako ima custom renderer, koristi ga
        const cell = row[col.name];
        html += '<td>' + (col.renderer ? col.renderer(cell, row) : cell) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody>';

    html += '</table>';

    // U DOM
    this.table.container.innerHTML = html;
  }
}