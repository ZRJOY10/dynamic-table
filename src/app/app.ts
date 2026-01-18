import { Component, signal } from '@angular/core';
import { Table } from './components/table/table';
import { ColumnConfig, TableConfig } from './components/table/table.types';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  startDate: string;
  status: boolean;
}

@Component({
  selector: 'app-root',
  imports: [Table],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Dynamic Table Demo');

  // Table configuration
  protected readonly tableConfig: TableConfig = {
    enableMultiSort: true,
    enableFiltering: true,
    enablePagination: true,
    enableRowSelection: true,
    enableColumnResize: true,
    enableColumnReorder: true,
    enableVirtualScroll: false,
    enableFrozenColumns: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    selectionMode: 'multiple',
    showSelectionCheckbox: true,
    stripedRows: true,
    hoverHighlight: true,
    rowKeyField: 'id',
    tableHeight: 500,
    emptyMessage: 'No employees found',
  };

  // Column definitions
  protected readonly columns: ColumnConfig<Employee>[] = [
    {
      key: 'id',
      title: 'ID',
      order: 0,
      width: 80,
      frozen: true,
      frozenPosition: 'left',
      sortable: true,
      filterable: false,
      align: 'center',
      cellType: 'number',
    },
    {
      key: 'firstName',
      title: 'First Name',
      order: 1,
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: 'lastName',
      title: 'Last Name',
      order: 2,
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: 'email',
      title: 'Email',
      order: 3,
      width: 250,
      sortable: true,
      filterable: true,
    },
    {
      key: 'department',
      title: 'Department',
      order: 4,
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      key: 'position',
      title: 'Position',
      order: 5,
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      key: 'salary',
      title: 'Salary',
      order: 6,
      width: 120,
      sortable: true,
      filterable: true,
      align: 'right',
      cellType: 'number',
      formatter: (value) => `$${value.toLocaleString()}`,
    },
    {
      key: 'startDate',
      title: 'Start Date',
      order: 7,
      width: 120,
      sortable: true,
      filterable: false,
      cellType: 'date',
    },
    {
      key: 'status',
      title: 'Active',
      order: 8,
      width: 100,
      frozen: false,
      sortable: true,
      filterable: false,
      align: 'center',
      cellType: 'boolean',
    },
  ];

  // Sample data
  protected readonly data: Employee[] = this.generateSampleData(100);

  private generateSampleData(count: number): Employee[] {
    const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Emma', 'Robert', 'Olivia', 'William', 'Sophia', 'Richard', 'Isabella', 'Joseph'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore'];
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Product', 'Design', 'Support'];
    const positions = ['Manager', 'Senior Developer', 'Developer', 'Analyst', 'Designer', 'Coordinator', 'Director', 'Lead', 'Specialist'];

    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      email: `employee${i + 1}@company.com`,
      department: departments[Math.floor(Math.random() * departments.length)],
      position: positions[Math.floor(Math.random() * positions.length)],
      salary: Math.floor(Math.random() * 100000) + 50000,
      startDate: new Date(2015 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      status: Math.random() > 0.2,
    }));
  }

  // Event handlers
  protected onSelectionChange(event: any): void {
    console.log('Selection changed:', event);
  }

  protected onSortChange(event: any): void {
    console.log('Sort changed:', event);
  }

  protected onFilterChange(event: any): void {
    console.log('Filter changed:', event);
  }

  protected onPageChange(event: any): void {
    console.log('Page changed:', event);
  }
}
