export const useOpenAIEmbeddings = () => {
  const createEmbedding = async (text: string) => {
    try {
      const response = await fetch('/api/openai/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model: "text-embedding-3-small",
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      throw error;
    }
  };

  const semanticSearch = async (query: string, documents: string[]) => {
    try {
      // Create embeddings for query and documents
      const queryEmbedding = await createEmbedding(query);
      const documentEmbeddings = await Promise.all(
        documents.map(doc => createEmbedding(doc))
      );

      // Calculate cosine similarity
      const similarities = documentEmbeddings.map((docEmb, index) => {
        const similarity = cosineSimilarity(queryEmbedding, docEmb);
        return { index, similarity, document: documents[index] };
      });

      // Sort by similarity (highest first)
      return similarities.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      throw error;
    }
  };

  const createContactEmbeddings = async (contacts: any[]) => {
    const embeddings = [];
    for (const contact of contacts) {
      try {
        const text = `${contact.name} ${contact.email} ${contact.company} ${contact.position} ${contact.notes || ''} ${contact.industry || ''} ${contact.location || ''}`;
        const embedding = await createEmbedding(text);
        embeddings.push({
          contactId: contact.id,
          embedding
        });
      } catch (error) {
        console.warn(`Failed to create embedding for contact ${contact.id}:`, error);
        // Continue with other contacts
      }
    }
    return embeddings;
  };

  const createDealEmbeddings = async (deals: any[]) => {
    const embeddings = [];
    for (const deal of deals) {
      try {
        const text = `${deal.title} ${deal.company} ${deal.contact} ${deal.stage} ${deal.priority} ${deal.value}`;
        const embedding = await createEmbedding(text);
        embeddings.push({
          dealId: deal.id,
          embedding
        });
      } catch (error) {
        console.warn(`Failed to create embedding for deal ${deal.id}:`, error);
        // Continue with other deals
      }
    }
    return embeddings;
  };

  const searchContacts = async (query: string, contactEmbeddings: any[], contactsById: any) => {
    const queryEmbedding = await createEmbedding(query);
    const results = [];

    for (const contactEmb of contactEmbeddings) {
      const contact = contactsById[contactEmb.contactId];
      if (contact) {
        const similarity = cosineSimilarity(queryEmbedding, contactEmb.embedding);
        results.push({
          contact,
          score: similarity
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  };

  const searchDeals = async (query: string, dealEmbeddings: any[], dealsById: any) => {
    const queryEmbedding = await createEmbedding(query);
    const results = [];

    for (const dealEmb of dealEmbeddings) {
      const deal = dealsById[dealEmb.dealId];
      if (deal) {
        const similarity = cosineSimilarity(queryEmbedding, dealEmb.embedding);
        results.push({
          deal,
          score: similarity
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  };

  return {
    createEmbedding,
    semanticSearch,
    createContactEmbeddings,
    createDealEmbeddings,
    searchContacts,
    searchDeals
  };
};

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}