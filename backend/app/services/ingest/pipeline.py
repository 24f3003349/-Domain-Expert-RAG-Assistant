"""Asynchronous document processing pipeline for production cloud deployment."""

import os
import tempfile
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.document import Document, DocumentStatus
from app.services.ingest.parsing import PDFParser
from app.services.rag_service import RAGService
from app.services.storage_service import StorageService


async def process_document_pipeline(document_id: str) -> None:
    """Download, parse, and index a document into the vector store."""
    async with AsyncSessionLocal() as db:
        try:
            # 1. Fetch document from DB
            stmt = select(Document).where(Document.id == document_id)
            result = await db.execute(stmt)
            document = result.scalar_one_or_none()
            if not document:
                print(f"Document {document_id} not found in database")
                return

            # 2. Update status to PROCESSING
            document.status = DocumentStatus.PROCESSING
            await db.commit()

            # 3. Download from Storage
            storage_service = StorageService()
            file_bytes = await storage_service.download_file(document.storage_url)

            # 4. Save to temporary file for Unstructured/LlamaIndex
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            try:
                # 5. Parse Document (Using Semantic Chunking)
                parser = PDFParser()
                nodes = parser.parse_pdf(
                    tmp_path, 
                    metadata={
                        "document_id": str(document.id),
                        "user_id": str(document.user_id),
                        "filename": document.filename
                    }
                )

                # 6. Index into Vector Store
                rag_service = RAGService()
                await rag_service.add_document_to_index(nodes)

                # 7. Update status to COMPLETED
                result = await db.execute(select(Document).where(Document.id == document_id))
                document = result.scalar_one()
                document.status = DocumentStatus.COMPLETED
                await db.commit()

            finally:
                # Cleanup temp file
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        except Exception as e:
            print(f"Error processing document {document_id}: {str(e)}")
            # Update status to FAILED
            try:
                result = await db.execute(select(Document).where(Document.id == document_id))
                document = result.scalar_one_or_none()
                if document:
                    document.status = DocumentStatus.FAILED
                    document.error_message = str(e)
                    await db.commit()
            except Exception as commit_err:
                print(f"Failed to commit FAILED status: {commit_err}")
