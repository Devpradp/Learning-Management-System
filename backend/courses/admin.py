from django.contrib import admin
from .models import Course, Chapter, Enrollment

admin.site.register(Course)
admin.site.register(Chapter)
admin.site.register(Enrollment)
