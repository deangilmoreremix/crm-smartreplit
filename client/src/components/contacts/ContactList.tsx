import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Zap, MoreHorizontal, ArrowUp, ArrowDown, CheckCheck, Loader2 } from 'lucide-react';
import Avatar from 'react-avatar';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  PaginationState,
} from '@tanstack/react-table';
import { Contact } from '../../types/contact';
import ContactEnrichmentModal from './ContactEnrichmentModal';

interface ContactListProps {
  contacts: Contact[];
  layout?: 'table' | 'card';
  showStatus?: boolean;
  onContactClick?: (contact: Contact) => void;
  aiEnhanced?: boolean;
}

const statusColors = {
  lead: 'bg-yellow-100 text-yellow-800',
  prospect: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  layout = 'card',
  showStatus = true,
  onContactClick,
  aiEnhanced = true,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [selectedContactForEnrichment, setSelectedContactForEnrichment] = useState<Contact | null>(
    null
  );

  const handleEnrichContact = (contact: Contact) => {
    setSelectedContactForEnrichment(contact);
    setEnrichmentModalOpen(true);
  };

  // Table setup using @tanstack/react-table
  const columnHelper = createColumnHelper<Contact>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => onContactClick?.(info.row.original)}
          >
            <Avatar name={info.getValue()} size="40" round className="mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {info.getValue()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {info.row.original.email}
              </div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('company', {
        header: 'Company',
        cell: (info) => (
          <div>
            <div className="text-sm text-gray-900 dark:text-white">{info.getValue() || 'N/A'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {info.row.original.position || ''}
            </div>
          </div>
        ),
      }),
      ...(showStatus
        ? [
            columnHelper.accessor('status', {
              header: 'Status',
              cell: (info) => (
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    statusColors[info.getValue() as keyof typeof statusColors]
                  }`}
                >
                  {info.getValue().charAt(0).toUpperCase() + info.getValue().slice(1)}
                </span>
              ),
            }),
          ]
        : []),
      columnHelper.accessor('score', {
        header: 'AI Score',
        cell: (info) => (
          <div className="flex items-center">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
              <div
                className={`h-2.5 rounded-full ${
                  info.getValue() && info.getValue() >= 80
                    ? 'bg-green-500'
                    : info.getValue() && info.getValue() >= 60
                      ? 'bg-blue-500'
                      : info.getValue() && info.getValue() >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${info.getValue() || 0}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{info.getValue()}/100</span>
          </div>
        ),
      }),
      columnHelper.accessor('lastContact', {
        header: 'Last Contact',
        cell: (info) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {info.getValue()?.toLocaleDateString() || 'N/A'}
          </span>
        ),
      }),
      columnHelper.accessor('industry', {
        header: 'Industry',
        cell: (info) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {info.getValue() || 'N/A'}
          </span>
        ),
      }),
      columnHelper.accessor('id', {
        header: 'Actions',
        cell: (info) => (
          <div className="flex justify-end space-x-2">
            {aiEnhanced && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEnrichContact(info.row.original);
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                title="Enrich contact with AI"
              >
                <Zap size={16} />
              </button>
            )}
            <Link
              to={`/contacts/${info.getValue()}`}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={16} />
            </Link>
          </div>
        ),
      }),
    ],
    [showStatus, aiEnhanced, onContactClick]
  );

  const table = useReactTable({
    columns,
    data: contacts,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onContactClick?.(contact)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar name={contact.name} size="48" round />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {contact.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</p>
                {contact.company && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{contact.company}</p>
                )}
              </div>
            </div>
            {aiEnhanced && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEnrichContact(contact);
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="Enrich contact with AI"
              >
                <Zap size={20} />
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {showStatus && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span
                  className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                    statusColors[contact.status as keyof typeof statusColors]
                  }`}
                >
                  {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">AI Score:</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      contact.score && contact.score >= 80
                        ? 'bg-green-500'
                        : contact.score && contact.score >= 60
                          ? 'bg-blue-500'
                          : contact.score && contact.score >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                    }`}
                    style={{ width: `${contact.score || 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {contact.score}/100
                </span>
              </div>
            </div>

            {contact.industry && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Industry:</span>
                <span className="text-sm text-gray-900 dark:text-white">{contact.industry}</span>
              </div>
            )}

            {contact.lastContact && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Contact:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {contact.lastContact.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Link
              to={`/contacts/${contact.id}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              View Details →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      {layout === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="ml-1">
                          {{
                            asc: <ArrowUp size={14} className="text-gray-500 dark:text-gray-400" />,
                            desc: (
                              <ArrowDown size={14} className="text-gray-500 dark:text-gray-400" />
                            ),
                          }[header.column.getIsSorted() as string] ?? (
                            <div className="opacity-0 group-hover:opacity-100">
                              <ArrowUp size={14} className="text-gray-300 dark:text-gray-600" />
                            </div>
                          )}
                        </span>
                      </div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {table.getRowModel().rows.length} of {contacts.length} contacts
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        renderCardView()
      )}

      {/* Enrichment Modal */}
      {selectedContactForEnrichment && (
        <ContactEnrichmentModal
          contact={selectedContactForEnrichment}
          isOpen={enrichmentModalOpen}
          onClose={() => {
            setEnrichmentModalOpen(false);
            setSelectedContactForEnrichment(null);
          }}
        />
      )}
    </div>
  );
};

export default ContactList;
