import OpenAI from 'openai';
import { useApiStore } from '../store/apiStore';
import { Contact, Deal } from '../types';

export const useOpenAIEmbeddings = () => {
  const { apiKeys } = useApiStore();
  
  const getClient = () => {
    if (!apiKeys.openai) {
      throw new Error('OpenAI API key is not set');
    }
    
    return new OpenAI({
      apiKey: apiKeys.openai,
      dangerouslyAllowBrowser: true // Note: In production, proxy requests through a backend
    });
  };
  
  // Helper function to check if error is quota related
  const isQuotaError = (error: any): boolean => {
    const errorMessage = error?.message || '';
    const errorStatus = error?.status;
    
    return (
      errorStatus === 429 ||
      errorMessage.includes('429') ||
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('exceeded') ||
      errorMessage.toLowerCase().includes('billing')
    );
  };
  
  // Helper function to check if error is API key related
  const isAPIKeyError = (error: any): boolean => {
    const errorMessage = error?.message || '';
    const errorStatus = error?.status;
    
    return (
      errorStatus === 401 ||
      errorMessage.includes('401') ||
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('api key') ||
      errorMessage.toLowerCase().includes('invalid key')
    );
  };
  
  // Create embeddings for a text
  const createEmbedding = async (text: string) => {
    const client = getClient();
    
    try {
      const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
      });
      
      return response.data[0].embedding;
    } catch (error) {
      // Only log unexpected errors, not quota or API key errors
      if (!isQuotaError(error) && !isAPIKeyError(error)) {
        console.error('Error creating embedding:', error);
      }
      throw error;
    }
  };

  // Create embeddings for multiple contacts to enable semantic search
  const createContactEmbeddings = async (contacts: Contact[]) => {
    try {
      const embeddings: { contactId: string, embedding: number[] }[] = [];
      
      for (const contact of contacts) {
        // Create a text representation of the contact
        const contactText = `
          Name: ${contact.name}
          Email: ${contact.email}
          Company: ${contact.company || ''}
          Position: ${contact.position || ''}
          Industry: ${contact.industry || ''}
          Status: ${contact.status}
          Notes: ${contact.notes || ''}
          Location: ${contact.location || ''}
        `;
        
        const embedding = await createEmbedding(contactText);
        embeddings.push({
          contactId: contact.id,
          embedding
        });
      }
      
      return embeddings;
    } catch (error) {
      // Only log unexpected errors, not quota or API key errors
      if (!isQuotaError(error) && !isAPIKeyError(error)) {
        console.error('Error creating contact embeddings:', error);
      }
      throw error;
    }
  };
  
  // Create embeddings for multiple deals to enable semantic search
  const createDealEmbeddings = async (deals: Deal[]) => {
    try {
      const embeddings: { dealId: string, embedding: number[] }[] = [];
      
      for (const deal of deals) {
        // Create a text representation of the deal
        const dealText = `
          Title: ${deal.title}
          Company: ${deal.company}
          Contact: ${deal.contact}
          Stage: ${deal.stage}
          Value: ${deal.value}
          Notes: ${deal.notes || ''}
        `;
        
        const embedding = await createEmbedding(dealText);
        embeddings.push({
          dealId: deal.id,
          embedding
        });
      }
      
      return embeddings;
    } catch (error) {
      // Only log unexpected errors, not quota or API key errors
      if (!isQuotaError(error) && !isAPIKeyError(error)) {
        console.error('Error creating deal embeddings:', error);
      }
      throw error;
    }
  };
  
  // Calculate cosine similarity between two vectors
  const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };
  
  // Perform semantic search on contacts
  const searchContacts = async (query: string, contactEmbeddings: { contactId: string, embedding: number[] }[], contactsById: Record<string, Contact>) => {
    try {
      // Create embedding for the query
      const queryEmbedding = await createEmbedding(query);
      
      // Calculate similarity scores
      const results = contactEmbeddings.map(contactEmb => {
        const similarity = cosineSimilarity(queryEmbedding, contactEmb.embedding);
        return {
          contact: contactsById[contactEmb.contactId],
          score: similarity
        };
      });
      
      // Sort by similarity score (highest first)
      return results.sort((a, b) => b.score - a.score);
    } catch (error) {
      // Only log unexpected errors, not quota or API key errors
      if (!isQuotaError(error) && !isAPIKeyError(error)) {
        console.error('Error searching contacts:', error);
      }
      throw error;
    }
  };
  
  // Perform semantic search on deals
  const searchDeals = async (query: string, dealEmbeddings: { dealId: string, embedding: number[] }[], dealsById: Record<string, Deal>) => {
    try {
      // Create embedding for the query
      const queryEmbedding = await createEmbedding(query);
      
      // Calculate similarity scores
      const results = dealEmbeddings.map(dealEmb => {
        const similarity = cosineSimilarity(queryEmbedding, dealEmb.embedding);
        return {
          deal: dealsById[dealEmb.dealId],
          score: similarity
        };
      });
      
      // Sort by similarity score (highest first)
      return results.sort((a, b) => b.score - a.score);
    } catch (error) {
      // Only log unexpected errors, not quota or API key errors
      if (!isQuotaError(error) && !isAPIKeyError(error)) {
        console.error('Error searching deals:', error);
      }
      throw error;
    }
  };
  
  return {
    createEmbedding,
    createContactEmbeddings,
    createDealEmbeddings,
    searchContacts,
    searchDeals
  };
};