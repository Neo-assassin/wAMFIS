from django.db import models
from django.contrib.auth.models import User


class ModelLog(models.Model):
    model_name = models.CharField(max_length=100)
    accuracy = models.FloatField()
    loss = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50)

    def __str__(self):
        return self.model_name


class Scan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='scans/')
    result = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.result}"


class DriftResult(models.Model):
    dataset = models.CharField(max_length=100)
    scenario = models.CharField(max_length=100)
    accuracy = models.FloatField()
    acc_drop = models.FloatField()
    psi = models.FloatField()
    confidence_drop = models.FloatField()
    top_drift_feature = models.CharField(max_length=100, blank=True)
    baseline_accuracy = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.dataset} - {self.scenario}"