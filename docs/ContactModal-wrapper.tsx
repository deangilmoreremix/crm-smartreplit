// ContactModal.tsx - Module Federation Wrapper for your Contact Modal
// Copy this file to your Bolt app at: /src/ContactModal.tsx

import React from "react";

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: any;
  mode: "create" | "edit" | "view";
  onSave?: (contact: any) => void;
  onDelete?: (contactId: string) => void;
}

// Import your existing Bolt contact modal component here
// Replace 'YourContactModal' with your actual modal component name
// import YourContactModal from './YourContactModal';

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  mode,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const handleSave = (contactData: any) => {
    console.log("Modal save:", contactData);
    onSave?.(contactData);
    onClose();
  };

  const handleDelete = () => {
    if (contact?.id) {
      console.log("Modal delete:", contact.id);
      onDelete?.(contact.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {mode === "create"
              ? "Create Contact"
              : mode === "edit"
                ? "Edit Contact"
                : "View Contact"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Replace this section with your actual Bolt modal content */}
        {/*
        <YourContactModal
          contact={contact}
          mode={mode}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={onClose}
        />
        */}

        {/* Temporary placeholder - REPLACE THIS with your actual modal */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              defaultValue={contact?.name || ""}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Contact name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              defaultValue={contact?.email || ""}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company
            </label>
            <input
              type="text"
              defaultValue={contact?.company || ""}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Company name"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {mode !== "view" && contact?.id && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            {mode !== "view" && (
              <button
                onClick={() =>
                  handleSave({
                    id: contact?.id || Date.now().toString(),
                    name: "Updated Contact",
                    email: "updated@example.com",
                    company: "Updated Company",
                  })
                }
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
