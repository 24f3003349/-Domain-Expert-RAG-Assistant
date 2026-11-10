"""PDF parsing service using LlamaIndex PDFReader."""

import os
import unicodedata
from typing import List

from llama_index.core import Document
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import TextNode
from llama_index.readers.file import PDFReader

from app.core.config import get_settings

settings = get_settings()


class PDFParser:
    """Service for parsing PDF documents into searchable chunks."""

    def __init__(self):
        """Initialize the parser with configured settings."""
        self.reader = PDFReader()
        
        self.node_parser = SentenceSplitter(
            chunk_size=1024,
            chunk_overlap=256,
        )

    def parse_pdf(self, file_path: str, metadata: dict = None) -> List[TextNode]:
        """
        Parse a PDF file into a list of TextNodes.
        
        Args:
            file_path: Path to the PDF file on local disk.
            metadata: Initial metadata to attach to all nodes.
            
        Returns:
            List of TextNodes ready for indexing.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at {file_path}")

        # 1. Load the document and normalize unicode characters
        documents = self.reader.load_data(file_path)
        for doc in documents:
            if hasattr(doc, "text") and doc.text:
                doc.text = unicodedata.normalize("NFKC", doc.text)
        
        # 2. Add metadata to documents
        if metadata:
            for doc in documents:
                doc.metadata.update(metadata)

        # 3. Parse into chunks/nodes
        nodes = self.node_parser.get_nodes_from_documents(documents)
        
        return nodes
