import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFormStore, FormTemplate } from '../store/formStore';
import FormPublicView from '../components/marketing/FormPublicView';

const FormPublic: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const { forms } = useFormStore();
  const [currentForm, setCurrentForm] = useState<FormTemplate | null>(null);
  
  useEffect(() => {
    if (formId && forms[formId]) {
      setCurrentForm(forms[formId]);
    }
  }, [formId, forms]);
  
  if (!currentForm) {
    return <div>Loading...</div>;
  }
  
  return <FormPublicView />;
};

export default FormPublic;