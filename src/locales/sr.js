/**
 * Serbian (sr) translations for TablixJS
 */
export const serbianTranslations = {
  // General
  'general.loading': 'Učitavanje...',
  'general.error': 'Greška',
  'general.noData': 'Nema dostupnih podataka',
  'general.show': 'Prikaži',
  'general.entries': 'unosa',
  'general.of': 'od',
  'general.to': 'do',
  'general.records': 'zapisa',
  'general.perPage': 'po stranici',
  'general.showing': 'Prikazano',
  'general.total': 'Ukupno',
  'general.rows': 'redova',

  // Search
  'search.placeholder': 'Pretraga...',
  'search.clear': 'Obriši pretragu',
  'search.noResults': 'Nema rezultata',
  'search.resultsFound': 'rezultata pronađeno',

  // Pagination
  'pagination.first': 'Prva',
  'pagination.previous': 'Prethodna',
  'pagination.next': 'Sledeća',
  'pagination.last': 'Poslednja',
  'pagination.page': 'Stranica',
  'pagination.pageOf': 'Stranica {currentPage} od {totalPages}',
  'pagination.showingRecords': 'Prikazano {startRow}-{endRow} od {totalRows} zapisa',
  'pagination.noRecords': 'Nema zapisa',
  'pagination.pageSize': 'Zapisa po stranici',

  // Sorting
  'sort.sortAscending': 'Sortiraj rastuće',
  'sort.sortDescending': 'Sortiraj opadajuće',
  'sort.sortedAscending': 'Sortirano rastuće',
  'sort.sortedDescending': 'Sortirano opadajuće',
  'sort.notSorted': 'Nije sortirano',
  'sort.clearSort': 'Obriši sortiranje',

  // Selection
  'selection.selectRow': 'Izaberi red',
  'selection.deselectRow': 'Poništi izbor reda',
  'selection.selectAll': 'Izaberi sve',
  'selection.deselectAll': 'Poništi sve',
  'selection.selectedCount': '{count} izabrano',
  'selection.selectAllVisible': 'Izaberi sve vidljive redove',
  'selection.clearSelection': 'Obriši izbor',

  // Filtering
  'filter.filter': 'Filter',
  'filter.clearFilter': 'Obriši filter',
  'filter.clearAllFilters': 'Obriši sve filtere',
  'filter.applyFilter': 'Primeni filter',
  'filter.filterBy': 'Filtriraj po',
  'filter.filterColumn': 'Filtriraj kolonu',
  'filter.filterByValue': 'Filtriraj po vrednosti',
  'filter.filterByCondition': 'Filtriraj po uslovu',
  'filter.searchValues': 'Pretraži vrednosti...',
  'filter.selectAll': 'Izaberi sve',
  'filter.noValuesAvailable': 'Nema dostupnih vrednosti',
  'filter.addCondition': 'Dodaj uslov',
  'filter.removeCondition': 'Ukloni uslov',
  'filter.value': 'Vrednost',
  'filter.apply': 'Primeni',
  'filter.clear': 'Obriši',
  'filter.cancel': 'Otkaži',
  'filter.contains': 'Sadrži',
  'filter.startsWith': 'Počinje sa',
  'filter.endsWith': 'Završava se sa',
  'filter.equals': 'Jednako',
  'filter.notEquals': 'Nije jednako',
  'filter.greaterThan': 'Veće od',
  'filter.lessThan': 'Manje od',
  'filter.greaterThanOrEqual': 'Veće ili jednako',
  'filter.lessThanOrEqual': 'Manje ili jednako',
  'filter.between': 'Između',
  'filter.isEmpty': 'Prazno',
  'filter.isNotEmpty': 'Nije prazno',
  'filter.selectValues': 'Izaberi vrednosti',
  'filter.noOptionsAvailable': 'Nema dostupnih opcija',
  'filter.complexDataNotSupported': 'Filtriranje po vrednosti nije dostupno za kolone sa složenim podacima. Koristite filtriranje po uslovu umesto toga.',

  // Controls
  'controls.refresh': 'Osveži podatke',
  'controls.export': 'Izvezi podatke',
  'controls.settings': 'Podešavanja',
  'controls.columns': 'Kolone',
  'controls.showColumns': 'Prikaži/Sakrij kolone',

  // Virtual Scrolling
  'virtualScroll.loadingMoreRows': 'Učitavanje dodatnih redova...',
  'virtualScroll.scrollToTop': 'Idi na vrh',
  'virtualScroll.scrollToBottom': 'Idi na dno',

  // Error Messages
  'error.loadingData': 'Neuspešno učitavanje podataka',
  'error.networkError': 'Došlo je do mrežne greške',
  'error.invalidData': 'Neispravan format podataka',
  'error.serverError': 'Došlo je do greške na serveru',
  'error.timeout': 'Isteklo vreme zahteva',
  'error.unknown': 'Došlo je do nepoznate greške',
  'error.retry': 'Pokušaj ponovo',

  // Data Types
  'dataType.string': 'Tekst',
  'dataType.number': 'Broj',
  'dataType.date': 'Datum',
  'dataType.boolean': 'Logička vrednost',
  'dataType.currency': 'Valuta',
  'dataType.percentage': 'Procenat',

  // Accessibility
  'accessibility.table': 'Tabela podataka',
  'accessibility.sortableColumn': 'Kolona za sortiranje',
  'accessibility.selectableRow': 'Red za izbor',
  'accessibility.rowSelected': 'Red izabran',
  'accessibility.rowNotSelected': 'Red nije izabran',
  'accessibility.pageNavigation': 'Navigacija stranica',
  'accessibility.searchInput': 'Pretraga podataka tabele',
  'accessibility.filterColumn': 'Filtriraj kolonu',

  // Actions
  'action.apply': 'Primeni',
  'action.cancel': 'Otkaži',
  'action.close': 'Zatvori',
  'action.save': 'Sačuvaj',
  'action.reset': 'Resetuj',
  'action.ok': 'U redu',
  'action.yes': 'Da',
  'action.no': 'Ne',

  // Time and Date
  'date.today': 'Danas',
  'date.yesterday': 'Juče',
  'date.thisWeek': 'Ove nedelje',
  'date.lastWeek': 'Prošle nedelje',
  'date.thisMonth': 'Ovog meseca',
  'date.lastMonth': 'Prošlog meseca',

  // Numbers and Formatting
  'format.currency.symbol': 'RSD',
  'format.decimal.separator': ',',
  'format.thousand.separator': '.',
  'format.percentage.symbol': '%'
};

export default serbianTranslations;
