from django.contrib import admin

from documents.models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["id", "original_name", "owner", "status", "file_size", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["original_name", "owner__username"]
    readonly_fields = ["created_at", "updated_at", "processed_at"]
