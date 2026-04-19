"""Auth serializers."""

from typing import ClassVar

from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    fullName = serializers.SerializerMethodField()
    isStaff = serializers.BooleanField(source="is_staff", read_only=True)

    class Meta:
        model = User
        fields: ClassVar[list[str]] = ["id", "username", "email", "fullName", "isStaff"]
        read_only_fields: ClassVar[list[str]] = fields

    def get_fullName(self, obj: User) -> str:
        return obj.get_full_name() or obj.username


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
