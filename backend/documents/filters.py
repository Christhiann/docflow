from django_filters import rest_framework as filters

from documents.models import Document


class DocumentFilter(filters.FilterSet):
    status = filters.CharFilter(method="filter_status")

    class Meta:
        model = Document
        fields = ["status"]

    def filter_status(self, queryset, name: str, value: str):
        return queryset.filter(status__iexact=value.strip())
