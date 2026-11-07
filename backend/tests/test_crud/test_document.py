import uuid
import pytest

from app.crud.document import document as document_crud
from app.models.document import DocumentStatus
from app.schemas.document import DocumentCreate, DocumentUpdate


@pytest.mark.unit
class TestDocumentCRUD:
    """Test document CRUD operations and user isolation."""

    async def test_create_and_get_document(self, test_db_session, test_user):
        """Test creating a document and retrieving it."""
        doc_in = DocumentCreate(
            filename="sample.pdf",
            file_hash="hash_12345",
            file_size=1024,
            content_type="application/pdf",
            storage_url="http://minio:9000/rag-documents/sample.pdf",
            user_id=test_user.id,
        )

        doc = await document_crud.create(test_db_session, obj_in=doc_in)
        assert doc is not None
        assert doc.filename == "sample.pdf"
        assert doc.file_hash == "hash_12345"
        assert doc.status == DocumentStatus.PENDING

        # Retrieve by user and id
        fetched = await document_crud.get_user_document(test_db_session, id=doc.id, user_id=test_user.id)
        assert fetched is not None
        assert fetched.id == doc.id

    async def test_hash_isolated_per_user(self, test_db_session, test_user):
        """Test that get_by_hash_and_user isolates documents between users."""
        other_user_id = uuid.uuid4()
        doc_in = DocumentCreate(
            filename="shared.pdf",
            file_hash="shared_hash_abc",
            file_size=2048,
            content_type="application/pdf",
            storage_url="http://minio:9000/rag-documents/shared.pdf",
            user_id=test_user.id,
        )
        await document_crud.create(test_db_session, obj_in=doc_in)

        # Matching user finds it
        found = await document_crud.get_by_hash_and_user(test_db_session, hash="shared_hash_abc", user_id=str(test_user.id))
        assert found is not None

        # Different user does NOT find it
        not_found = await document_crud.get_by_hash_and_user(test_db_session, hash="shared_hash_abc", user_id=str(other_user_id))
        assert not_found is None

    async def test_delete_document(self, test_db_session, test_user):
        """Test document deletion."""
        doc_in = DocumentCreate(
            filename="to_delete.pdf",
            file_hash="hash_delete",
            file_size=512,
            content_type="application/pdf",
            storage_url="http://minio:9000/rag-documents/to_delete.pdf",
            user_id=test_user.id,
        )
        doc = await document_crud.create(test_db_session, obj_in=doc_in)
        doc_id = doc.id

        await document_crud.delete(test_db_session, id=doc_id)
        fetched = await document_crud.get(test_db_session, id=doc_id)
        assert fetched is None
