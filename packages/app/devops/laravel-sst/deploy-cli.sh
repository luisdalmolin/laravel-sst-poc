#!/bin/bash

./deploy.sh

php artisan migrate --force
